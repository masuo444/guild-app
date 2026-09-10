import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hasMemberAccess } from '@/lib/member-access'
import { notifyAdminMessage } from '@/lib/notifications'

/** まっすーへの質問（会員限定）。自分の質問一覧と投稿 */
export async function GET() {
  if (!await hasMemberAccess()) return NextResponse.json({ error: 'Paid membership required' }, { status: 403 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase
    .from('member_questions')
    .select('id, body, status, answer_post_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) return NextResponse.json({ available: false })
  return NextResponse.json({ available: true, questions: data ?? [] })
}

export async function POST(req: NextRequest) {
  if (!await hasMemberAccess()) return NextResponse.json({ error: 'Paid membership required' }, { status: 403 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: { text?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const text = (body.text || '').trim().slice(0, 2000)
  if (!text) return NextResponse.json({ error: 'empty' }, { status: 400 })
  const { data, error } = await supabase.from('member_questions').insert({ user_id: user.id, body: text }).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://guild.fomusglobal.com'
  notifyAdminMessage(`質問: ${profile?.display_name || user.email}`, [text, `${appUrl}/app/admin`]).catch(() => {})
  return NextResponse.json({ success: true, id: data.id })
}
