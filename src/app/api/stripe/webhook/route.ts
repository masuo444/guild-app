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

        // 招待者がいる場合、招待クエストを自動達成
        if (profile?.invited_by) {
          // 招待クエストを取得
          const { data: inviteQuest } = await supabase
            .from('guild_quests')
            .select('id, points_reward')
            .eq('is_auto', true)
            .eq('title', '友達をGuildに招待しよう')
            .eq('is_active', true)
            .single()

          if (inviteQuest) {
            // 重複チェック（同じ被招待者で既に達成済みか）
            const { data: existingSubmission } = await supabase
              .from('quest_submissions')
              .select('id')
              .eq('quest_id', inviteQuest.id)
              .eq('user_id', profile.invited_by)
              .eq('comment', userId)
              .single()

            if (!existingSubmission) {
              // クエスト自動達成（承認済みで作成）
              await supabase.from('quest_submissions').insert({
                quest_id: inviteQuest.id,
                user_id: profile.invited_by,
                status: 'approved',
                reviewed_at: new Date().toISOString(),
                comment: userId, // 重複チェック用に被招待者のIDを記録
              })

              // クエスト報酬ポイントを付与
              await supabase.from('activity_logs').insert({
                user_id: profile.invited_by,
                type: 'Quest Reward',
                note: `Quest: ${inviteQuest.id}:${userId}`,
                points: inviteQuest.points_reward,
              })
            }
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

        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
