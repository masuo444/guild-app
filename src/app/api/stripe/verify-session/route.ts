import { stripe } from '@/lib/stripe/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateMembershipId } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    // 認証済みユーザーがいる場合はプロフィールを直接アクティベート
    let activated = false
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user && session.customer_details?.email === user.email) {
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
      } else if (profile?.subscription_status === 'active') {
        activated = true
      }
    }

    return NextResponse.json({
      email: session.customer_details?.email,
      subscriptionId: session.subscription,
      customerId: session.customer,
      inviteCode: session.metadata?.invite_code,
      activated,
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to verify session' },
      { status: 500 }
    )
  }
}
