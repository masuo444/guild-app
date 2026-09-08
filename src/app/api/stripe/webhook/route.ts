import { stripe } from '@/lib/stripe/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateMembershipId } from '@/lib/utils'
import { notifyAdminMasuOrder } from '@/lib/notifications'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    // Webhook signature verification failed
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const subscriptionId = session.subscription as string
        const customerId = session.customer as string

        // サブスクリプション情報を取得
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const userId = subscription.metadata.supabase_user_id

        if (!userId) {
          // No user ID in subscription metadata
          break
        }

        // 現在のプロフィールを取得（invited_by + 冪等性チェック）
        const { data: profile } = await supabase
          .from('profiles')
          .select('invited_by, subscription_status')
          .eq('id', userId)
          .single()

        // 既にactiveならスキップ（リトライ対策）
        if (profile?.subscription_status === 'active') break

        // プロファイルを更新（会員証ID発行）
        const membershipId = generateMembershipId()
        await supabase
          .from('profiles')
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: 'active',
            membership_status: 'active',
            membership_id: membershipId,
          })
          .eq('id', userId)

        // 枡セットプランなら、まっすーに発送先を通知
        if (session.metadata?.plan === 'masu') {
          // shipping_address_collection で収集した住所を取得（API版差異に対応して防御的に読む）
          const s = session as unknown as {
            shipping_details?: { name?: string | null; address?: Record<string, string | null> | null } | null
            collected_information?: { shipping_details?: { name?: string | null; address?: Record<string, string | null> | null } | null } | null
            customer_details?: { email?: string | null; name?: string | null; phone?: string | null } | null
          }
          const shipping = s.collected_information?.shipping_details ?? s.shipping_details ?? null
          await notifyAdminMasuOrder({
            email: s.customer_details?.email ?? null,
            name: shipping?.name ?? s.customer_details?.name ?? null,
            phone: s.customer_details?.phone ?? null,
            address: shipping?.address ?? null,
          }).catch((e) => console.error('Masu order notification error:', e))
        }

        // User activated successfully
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata.supabase_user_id

        if (!userId) break

        const status = subscription.status === 'active' ? 'active' : 'inactive'

        await supabase
          .from('profiles')
          .update({
            subscription_status: status,
            membership_status: status,
          })
          .eq('id', userId)

        // Subscription status updated
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata.supabase_user_id

        if (!userId) break

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'canceled',
            membership_status: 'inactive',
          })
          .eq('id', userId)

        // Subscription canceled
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.parent?.subscription_details?.subscription as string | undefined

        if (!subscriptionId) break

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const userId = subscription.metadata.supabase_user_id

        if (!userId) break

        await supabase
          .from('profiles')
          .update({
            subscription_status: 'past_due',
            membership_status: 'inactive',
          })
          .eq('id', userId)

        // Payment failed - user status updated
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice

        // 継続課金のみ対象（初回課金は除外）
        if (invoice.billing_reason !== 'subscription_cycle') break

        const subscriptionId = invoice.parent?.subscription_details?.subscription as string | undefined
        if (!subscriptionId) break

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const userId = subscription.metadata.supabase_user_id

        if (!userId) break

        // 継続ボーナスを付与（月ごとに1回）
        const periodStart = new Date((invoice.period_start ?? 0) * 1000).toISOString().slice(0, 7) // YYYY-MM形式

        // 重複チェック（同月の Renewal Bonus が既に存在するか）
        const { data: existingRenewal } = await supabase
          .from('activity_logs')
          .select('id')
          .eq('user_id', userId)
          .eq('type', 'Renewal Bonus')
          .eq('note', periodStart)
          .single()

        if (!existingRenewal) {
          await supabase.from('activity_logs').insert({
            user_id: userId,
            type: 'Renewal Bonus',
            note: periodStart,
            points: 100,
          })
        }

        // 1年継続バッジチェック
        const { count: renewalCount } = await supabase
          .from('activity_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('type', 'Renewal Bonus')

        if ((renewalCount ?? 0) >= 11) {
          const { data: badgeProfile } = await supabase
            .from('profiles')
            .select('badges')
            .eq('id', userId)
            .single()

          if (badgeProfile && !(badgeProfile.badges ?? []).includes('one_year')) {
            await supabase
              .from('profiles')
              .update({
                badges: [...(badgeProfile.badges ?? []), 'one_year'],
              })
              .eq('id', userId)
          }
        }

        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    // エラーはログに残すが、Stripeには200を返す
    // （200以外を返すとStripeが72時間リトライし続けるため）
    console.error('Webhook processing error:', error)
    return NextResponse.json({ received: true, error: 'processing_failed' })
  }
}
