import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // リクエストボディから国情報・プランを取得
    const body = await request.json().catch(() => ({}))
    const isJapan = body.isJapan === true
    const plan: 'monthly' | 'annual' | 'masu' =
      body.plan === 'annual' || body.plan === 'masu' ? body.plan : 'monthly'

    // プラン × 地域で価格IDを選択
    const priceMap: Record<'monthly' | 'annual' | 'masu', { jp?: string; intl?: string }> = {
      monthly: { jp: process.env.STRIPE_PRICE_ID_JPY, intl: process.env.STRIPE_PRICE_ID_USD },
      annual: { jp: process.env.STRIPE_PRICE_ID_ANNUAL_JPY, intl: process.env.STRIPE_PRICE_ID_ANNUAL_USD },
      masu: { jp: process.env.STRIPE_PRICE_ID_MASU_JPY }, // 枡プランは日本国内のみ
    }

    // 枡プランは日本国内限定（発送の都合）
    if (plan === 'masu' && !isJapan) {
      return NextResponse.json(
        { error: 'The Masu set plan ships within Japan only.' },
        { status: 400 }
      )
    }

    const priceId = isJapan ? priceMap[plan].jp : priceMap[plan].intl
    if (!priceId) {
      return NextResponse.json({ error: 'Plan is not available' }, { status: 400 })
    }

    // プロファイルを取得
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    // Stripe顧客が存在しない場合は作成
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      // プロファイルに保存
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Checkout Session を作成
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/pending?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/subscribe?canceled=true`,
      // 枡プランは発送先の住所と電話番号を収集（日本国内のみ）
      ...(plan === 'masu'
        ? {
            shipping_address_collection: { allowed_countries: ['JP' as const] },
            phone_number_collection: { enabled: true },
          }
        : {}),
      // Webフックが枡プランを判別して発送通知を出せるように metadata を付与
      metadata: {
        supabase_user_id: user.id,
        plan,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch {
    // Checkout error
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
