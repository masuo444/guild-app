import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ADMIN_EMAILS } from '@/lib/access'

let vapidInitialized = false
function initVapid() {
  if (!vapidInitialized && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      'mailto:keisukendo414@gmail.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    )
    vapidInitialized = true
  }
}

export async function POST(request: NextRequest) {
  initVapid()

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

  const { title, body: postBody, imageUrl, isPremium, notify } = body as {
    title?: string
    body?: string
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
      image_url: imageUrl?.trim() || null,
      is_premium: !!isPremium,
    })
    .select('id')
    .single()

  if (insertError || !post) {
    console.error('Feed post insert error:', insertError)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }

  // プッシュ通知送信（notify=false でスキップ可能）
  let sent = 0
  let failed = 0

  if (notify !== false) {
    const { data: subscriptions } = await serviceClient
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')

    if (subscriptions && subscriptions.length > 0) {
      const payload = JSON.stringify({
        title: 'まっすーが投稿しました',
        body: title.trim(),
        url: '/app/feed',
      })

      const results = await Promise.allSettled(
        subscriptions.map(async (sub) => {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload
            )
            return { success: true }
          } catch (err) {
            const statusCode = (err as { statusCode?: number }).statusCode
            if (statusCode === 410 || statusCode === 404) {
              await serviceClient.from('push_subscriptions').delete().eq('id', sub.id)
            }
            return { success: false }
          }
        })
      )
      sent = results.filter((r) => r.status === 'fulfilled' && r.value.success).length
      failed = results.length - sent
    }
  }

  return NextResponse.json({ success: true, postId: post.id, sent, failed })
}
