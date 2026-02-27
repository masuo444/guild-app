import { stripe } from '@/lib/stripe/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateMembershipId } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    // Verify the session belongs to this user (by email match)
    if (session.customer_details?.email !== user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 決済確認済み → プロフィールを直接アクティベート（Webhook待ち不要）
    let activated = false
    const supabaseAdmin = createServiceClient()
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('subscription_status, membership_id')
      .eq('id', user.id)
      .single()

    if (profile && profile.subscription_status !== 'active') {
      const updateData: Record<string, string> = {
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        subscription_status: 'active',
        membership_status: 'active',
      }

      if (!profile.membership_id) {
        updateData.membership_id = generateMembershipId()
      }

      await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

      activated = true
    }

    return NextResponse.json({
      email: session.customer_details?.email,
      subscriptionId: session.subscription,
      customerId: session.customer,
      inviteCode: session.metadata?.invite_code,
      activated: activated || profile?.subscription_status === 'active',
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to verify session' },
      { status: 500 }
    )
  }
}
