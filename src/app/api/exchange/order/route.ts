import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { item_id } = body

    if (!item_id) {
      return NextResponse.json({ error: 'item_id is required' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // アイテム存在・有効・在庫チェック
    const { data: item, error: itemError } = await supabaseAdmin
      .from('exchange_items')
      .select('*')
      .eq('id', item_id)
      .single()

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    if (!item.is_active) {
      return NextResponse.json({ error: 'Item is not available' }, { status: 400 })
    }

    if (item.stock === 0) {
      return NextResponse.json({ error: 'Out of stock' }, { status: 400 })
    }

    // MASUポイント残高チェック（activity_logs全件合計）
    const { data: logs, error: logsError } = await supabaseAdmin
      .from('activity_logs')
      .select('points')
      .eq('user_id', user.id)

    if (logsError) {
      return NextResponse.json({ error: 'Failed to check points' }, { status: 500 })
    }

    const masuPoints = logs.reduce((sum, log) => sum + log.points, 0)

    if (masuPoints < item.points_cost) {
      return NextResponse.json({ error: 'Insufficient points' }, { status: 400 })
    }

    // exchange_orders にpending行挿入
    const { error: orderError } = await supabaseAdmin
      .from('exchange_orders')
      .insert({
        user_id: user.id,
        item_id: item.id,
        points_spent: item.points_cost,
        status: 'pending',
      })

    if (orderError) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // activity_logs にマイナスエントリ挿入
    const { error: logError } = await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: user.id,
        type: 'Point Exchange',
        points: -item.points_cost,
        note: item.name,
      })

    if (logError) {
      return NextResponse.json({ error: 'Failed to record point deduction' }, { status: 500 })
    }

    // 在庫があればデクリメント（-1=無制限の場合はスキップ）
    if (item.stock > 0) {
      await supabaseAdmin
        .from('exchange_items')
        .update({ stock: item.stock - 1 })
        .eq('id', item.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
