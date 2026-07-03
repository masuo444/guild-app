import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * ログインユーザーの言語設定をプロフィールに保存する。
 * メルマガのJA/EN出し分けに使うため、クライアントの言語切替時に呼ばれる。
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    // 未ログイン時は何もしない（公開ページからの呼び出しを許容）
    return NextResponse.json({ ok: false }, { status: 200 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const language = body?.language
  if (language !== 'ja' && language !== 'en') {
    return NextResponse.json({ error: 'Invalid language' }, { status: 400 })
  }

  const service = createServiceClient()
  const { error } = await service.from('profiles').update({ language }).eq('id', user.id)
  if (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
