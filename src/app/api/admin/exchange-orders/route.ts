import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { ADMIN_EMAILS } from '@/lib/access'

async function checkAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || ADMIN_EMAILS.includes(user.email as typeof ADMIN_EMAILS[number])
  return isAdmin ? user : null
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  try {
    const user = await checkAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const supabaseAdmin = getServiceClient()
    const { data, error } = await supabaseAdmin
      .from('exchange_orders')
      .select('*, exchange_items(name, points_cost, coupon_code), profiles:user_id(display_name, membership_id)')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ orders: data })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await checkAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 })
    }

    const supabaseAdmin = getServiceClient()

    // 注文を取得
    const { data: order, error: orderError } = await supabaseAdmin
      .from('exchange_orders')
      .select('*, exchange_items(coupon_code, stock, name)')
      .eq('id', id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (status === 'approved') {
      const itemCoupon = order.exchange_items?.coupon_code || null

      // coupon_codeをorder行にコピー、reviewed_by/at設定
      const { error } = await supabaseAdmin
        .from('exchange_orders')
        .update({
          status: 'approved',
          coupon_code: itemCoupon,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // カードテーマの自動適用: coupon_code が "theme:xxx" の場合
      if (itemCoupon && itemCoupon.startsWith('theme:')) {
        const themeName = itemCoupon.replace('theme:', '')
        await supabaseAdmin
          .from('profiles')
          .update({ card_theme: themeName })
          .eq('id', order.user_id)
      }
    } else if (status === 'rejected' || status === 'canceled') {
      // ステータス更新
      const { error } = await supabaseAdmin
        .from('exchange_orders')
        .update({
          status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // ポイント返却
      if (order.status === 'pending') {
        await supabaseAdmin.from('activity_logs').insert({
          user_id: order.user_id,
          type: 'Point Exchange Reversal',
          points: order.points_spent,
          note: order.exchange_items?.name || 'Refund',
        })

        // 在庫戻し（stock > 0 のアイテムのみ）
        if (order.exchange_items && order.exchange_items.stock >= 0) {
          await supabaseAdmin
            .from('exchange_items')
            .update({ stock: order.exchange_items.stock + 1 })
            .eq('id', order.item_id)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
