import { stripe } from '@/lib/stripe/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateMembershipId } from '@/lib/utils'
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

        // 現在のプロフィールを取得（invited_by を確認するため）
        const { data: profile } = await supabase
          .from('profiles')
          .select('invited_by')
          .eq('id', userId)
          .single()

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

        // 招待者がいる場合、月額会員登録ボーナスを付与
        if (profile?.invited_by) {
          // 重複付与チェック（同じユーザーからの Subscription Bonus が既にあるか）
          const { data: existingBonus } = await supabase
            .from('activity_logs')
            .select('id')
            .eq('user_id', profile.invited_by)
            .eq('type', 'Subscription Bonus')
            .eq('note', userId)
            .single()

          if (!existingBonus) {
            await supabase.from('activity_logs').insert({
              user_id: profile.invited_by,
              type: 'Subscription Bonus',
              note: userId, // 重複チェック用に新規会員のIDを記録
              points: 100,
            })
          }
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
        await supabase.from('activity_logs').insert({
          user_id: userId,
          type: 'Renewal Bonus',
          note: periodStart, // 重複チェック用に対象月を記録
          points: 100,
        })

        break
      }
    }

    return NextResponse.json({ received: true })
  } catch {
    // Webhook processing error
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
