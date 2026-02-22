import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { theme } = await request.json()

    // null = デフォルト（ランク別）テーマに戻す
    if (theme === null) {
      const supabase = createServiceClient()
      await supabase
        .from('profiles')
        .update({ card_theme: null })
        .eq('id', user.id)
      return NextResponse.json({ success: true })
    }

    if (typeof theme !== 'string') {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 })
    }

    // ユーザーがこのテーマを購入済みか確認
    const supabase = createServiceClient()
    const { data: orders } = await supabase
      .from('exchange_orders')
      .select('id, exchange_items!inner(coupon_code)')
      .eq('user_id', user.id)
      .eq('status', 'approved')

    const ownedThemes = (orders || [])
      .filter((order) => {
        const item = order.exchange_items as unknown as { coupon_code: string | null }
        return item?.coupon_code?.startsWith('theme:')
      })
      .map((order) => {
        const item = order.exchange_items as unknown as { coupon_code: string }
        return item.coupon_code.replace('theme:', '')
      })

    if (!ownedThemes.includes(theme)) {
      return NextResponse.json({ error: 'Theme not owned' }, { status: 403 })
    }

    await supabase
      .from('profiles')
      .update({ card_theme: theme })
      .eq('id', user.id)

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Card theme update error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
