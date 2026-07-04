import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// 紛らわしい文字(0/O, 1/I)を除いた英数字
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function generateCode(): string {
  let code = ''
  const bytes = crypto.randomBytes(6)
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[bytes[i] % CODE_CHARS.length]
  }
  return code
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceClient = createServiceClient()

  const { data: existing } = await serviceClient
    .from('member_sales_codes')
    .select('code')
    .eq('member_id', user.id)
    .maybeSingle()

  let code = existing?.code

  if (!code) {
    // 重複時は再生成してリトライ（unique制約に依存）
    for (let attempt = 0; attempt < 5 && !code; attempt++) {
      const candidate = generateCode()
      const { error: insertError } = await serviceClient
        .from('member_sales_codes')
        .insert({ member_id: user.id, code: candidate })

      if (!insertError) {
        code = candidate
      } else if (!insertError.message?.includes('duplicate')) {
        return NextResponse.json({ error: 'Failed to issue code' }, { status: 500 })
      }
    }

    if (!code) {
      return NextResponse.json({ error: 'Failed to issue code' }, { status: 500 })
    }
  }

  const { data: credits } = await serviceClient
    .from('sales_credits')
    .select('order_id, amount_jpy, points, created_at')
    .eq('member_id', user.id)
    .order('created_at', { ascending: false })

  const totalPoints = (credits ?? []).reduce((sum, c) => sum + c.points, 0)
  const totalAmountJpy = (credits ?? []).reduce((sum, c) => sum + c.amount_jpy, 0)

  return NextResponse.json({
    code,
    totalPoints,
    totalAmountJpy,
    history: credits ?? [],
  })
}
