import { stripe } from '@/lib/stripe/server'
import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { inviteCode, isJapan } = await request.json()

    if (!inviteCode) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 })
    }

    // Validate invite code
    const supabase = createServiceClient()
    const { data: invite, error } = await supabase
      .from('invites')
      .select('code, used, membership_type')
      .eq('code', inviteCode)
      .single()

    if (error || !invite) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 })
    }

    if (invite.used) {
      return NextResponse.json({ error: 'Invite code already used' }, { status: 400 })
    }

    // Select price based on location
    const priceId = isJapan
      ? process.env.STRIPE_PRICE_ID_JPY!
      : process.env.STRIPE_PRICE_ID_USD!

    // Create Stripe checkout session (Stripe will collect email)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        invite_code: inviteCode,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${inviteCode}/paid?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${inviteCode}?canceled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch {
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
