import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ADMIN_EMAILS } from '@/lib/access'
import { sendNewPostEmail } from '@/lib/post-email'

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

  // 会員へメール配信（notify=false でスキップ）。失敗しても投稿自体は成功扱い。
  let sent = 0
  let failed = 0
  if (notify !== false) {
    try {
      const r = await sendNewPostEmail({ id: post.id, title: title.trim(), body: postBody.trim() })
      sent = r.sent
      failed = r.failed
    } catch (e) {
      console.error('New post email error:', e)
    }
  }

  return NextResponse.json({ success: true, postId: post.id, sent, failed })
}
