import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_EMAILS } from '@/lib/access'
import { translateNewsletter } from '@/lib/translate-newsletter'

// Claude翻訳は数十秒かかることがあるので実行時間上限を延ばす
export const maxDuration = 60

/** 管理者: メルマガの英語版プレビューを生成する（送信前に人の目で直すための下書き）。 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin' || ADMIN_EMAILS.includes(user.email as typeof ADMIN_EMAILS[number])
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 503 })
  }

  let payload
  try { payload = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { subject, body } = payload as { subject?: string; body?: string }
  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: '件名と本文を入力してください' }, { status: 400 })
  }
  if (subject.length > 300 || body.length > 20000) {
    return NextResponse.json({ error: '本文が長すぎます' }, { status: 400 })
  }

  try {
    const t = await translateNewsletter({ subject, body })
    return NextResponse.json({ subject: t.subject_en, body: t.body_en })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('newsletter translate error', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
