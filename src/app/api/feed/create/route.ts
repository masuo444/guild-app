import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ADMIN_EMAILS } from '@/lib/access'
import { sendNewPostEmail } from '@/lib/post-email'
import { translatePost } from '@/lib/translate-post'

// 英訳（数十秒）＋メール配信を1リクエストで行うため実行時間上限を延ばす
export const maxDuration = 60

export async function POST(request: NextRequest) {
  // 管理者認証
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || ADMIN_EMAILS.includes(user.email as typeof ADMIN_EMAILS[number])
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { title, body: postBody, category, imageUrl, isPremium, notify } = body as {
    title?: string
    body?: string
    category?: string | null
    imageUrl?: string | null
    isPremium?: boolean
    notify?: boolean
  }

  if (!title?.trim() || !postBody?.trim()) {
    return NextResponse.json({ error: 'title and body are required' }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  const { data: post, error: insertError } = await serviceClient
    .from('feed_posts')
    .insert({
      author_id: user.id,
      title: title.trim(),
      body: postBody.trim(),
      category: category?.trim() || null,
      image_url: imageUrl?.trim() || null,
      is_premium: !!isPremium,
    })
    .select('id')
    .single()

  if (insertError || !post) {
    console.error('Feed post insert error:', insertError)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }

  // 英語版を自動生成（キー未設定・失敗時はスキップ。記事ページの「英語版を生成」で後からも可）
  let title_en: string | null = null
  let body_en: string | null = null
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const t = await translatePost({ title: title.trim(), body: postBody.trim() })
      title_en = t.title_en
      body_en = t.body_en
      await serviceClient.from('feed_posts').update({ title_en, body_en, translated_at: new Date().toISOString() }).eq('id', post.id)
    } catch (e) {
      console.error('auto-translate error:', e)
    }
  }

  // 会員へメール配信（notify=false でスキップ）。失敗しても投稿自体は成功扱い。
  let sent = 0
  let failed = 0
  if (notify !== false) {
    try {
      const r = await sendNewPostEmail({ id: post.id, title: title.trim(), body: postBody.trim(), title_en, body_en })
      sent = r.sent
      failed = r.failed
    } catch (e) {
      console.error('New post email error:', e)
    }
  }

  return NextResponse.json({ success: true, postId: post.id, sent, failed })
}
