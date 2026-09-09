import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ADMIN_EMAILS } from '@/lib/access'
import { translatePost } from '@/lib/translate-post'

// 翻訳は数十秒かかるので関数の実行時間上限を延ばす
export const maxDuration = 60

/** 管理者: 記事の英語版を生成（再生成も同じ）。 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin' || ADMIN_EMAILS.includes(user.email as typeof ADMIN_EMAILS[number])
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 503 })

  const { id } = await params
  const service = createServiceClient()
  const { data: post } = await service.from('feed_posts').select('id, title, body').eq('id', id).single()
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const t = await translatePost(post)
    const { error } = await service.from('feed_posts').update({ title_en: t.title_en, body_en: t.body_en, translated_at: new Date().toISOString() }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, title_en: t.title_en })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('translate error', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
