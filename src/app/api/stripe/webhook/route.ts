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
