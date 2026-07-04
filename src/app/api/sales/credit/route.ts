import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getSetting } from '@/lib/settings'

/**
 * ショップ側(shop.fomus.jp)から枡購入時に叩かれるサーバー間API。
 * 認証は共有シークレット(x-sales-secret ヘッダー)。ユーザーセッションは介在しない。
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-sales-secret')

  if (!process.env.SALES_WEBHOOK_SECRET || secret !== process.env.SALES_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { orderId, code, amountJpy, buyerEmail } = body as {
    orderId?: string
    code?: string
    amountJpy?: number
    buyerEmail?: string
  }

  if (!orderId || !code || !amountJpy || amountJpy <= 0) {
    return NextResponse.json({ error: 'orderId, code, amountJpy are required' }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  const { data: codeRow } = await serviceClient
    .from('member_sales_codes')
    .select('member_id, profiles(id, display_name)')
    .eq('code', code.toUpperCase())
    .maybeSingle<{ member_id: string; profiles: { id: string; display_name: string | null } | null }>()

  if (!codeRow) {
    return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
  }

  // 自己付与防止: 購入者メールがコード所有者本人のメールと一致する場合は却下
  if (buyerEmail) {
    const { data: authUser } = await serviceClient.auth.admin.getUserById(codeRow.member_id)
    if (authUser?.user?.email && authUser.user.email.toLowerCase() === buyerEmail.toLowerCase()) {
      return NextResponse.json({ error: 'Self-referral is not allowed' }, { status: 400 })
    }
  }

  const [commissionPercentStr, pointsPerYenStr] = await Promise.all([
    getSetting('sales_commission_percent'),
    getSetting('sales_points_per_yen'),
  ])

  const commissionPercent = parseFloat(commissionPercentStr || '10')
  const pointsPerYen = parseFloat(pointsPerYenStr || '1')
  const points = Math.round(amountJpy * (commissionPercent / 100) * pointsPerYen)

  const { error: creditError } = await serviceClient.from('sales_credits').insert({
    order_id: orderId,
    member_id: codeRow.member_id,
    amount_jpy: amountJpy,
    points,
  })

  if (creditError) {
    // unique制約違反 = このorder_idは既に処理済み（冪等に成功扱い）
    if (creditError.code === '23505') {
      return NextResponse.json({ success: true, duplicate: true })
    }
    console.error('sales_credits insert error:', creditError)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }

  const { error: activityError } = await serviceClient.from('activity_logs').insert({
    user_id: codeRow.member_id,
    type: 'Sales Reward',
    points,
    note: `枡販売紹介 注文${orderId}`,
  })

  if (activityError) {
    console.error('activity_logs insert error (sales reward):', activityError)
  }

  return NextResponse.json({ success: true, points })
}
