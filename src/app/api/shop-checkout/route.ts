import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SHOP_BASE_URL = process.env.SHOP_BASE_URL || 'https://shop.fomus.jp'

export async function POST(request: NextRequest) {
  // Verify guild member
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { items, shipping } = body

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'カートが空です' }, { status: 400 })
  }

  // Call Shop's Stripe Checkout API
  const res = await fetch(`${SHOP_BASE_URL}/api/stripe/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items,
      shipping,
      currency: 'jpy',
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    return NextResponse.json({ error: data.error || '決済の作成に失敗しました' }, { status: res.status })
  }

  return NextResponse.json({ url: data.url })
}
