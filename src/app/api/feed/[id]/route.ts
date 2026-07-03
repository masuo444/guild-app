import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ADMIN_EMAILS } from '@/lib/access'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 as const }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const isAdmin = profile?.role === 'admin' || ADMIN_EMAILS.includes(user.email as typeof ADMIN_EMAILS[number])
  if (!isAdmin) return { error: 'Forbidden', status: 403 as const }
  return { user }
}

// 投稿の編集（管理者のみ）
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { title, body: postBody, imageUrl, isPremium } = body as {
    title?: string
    body?: string
    imageUrl?: string | null
    isPremium?: boolean
  }

  const update: Record<string, unknown> = {}
  if (typeof title === 'string') {
    if (!title.trim()) return NextResponse.json({ error: 'title cannot be empty' }, { status: 400 })
    update.title = title.trim()
  }
  if (typeof postBody === 'string') {
    if (!postBody.trim()) return NextResponse.json({ error: 'body cannot be empty' }, { status: 400 })
    update.body = postBody.trim()
  }
  if (imageUrl !== undefined) update.image_url = imageUrl?.trim() || null
  if (typeof isPremium === 'boolean') update.is_premium = isPremium

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const { error } = await serviceClient.from('feed_posts').update(update).eq('id', id)
  if (error) {
    console.error('Feed post update error:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

// 投稿の削除（管理者のみ）
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const serviceClient = createServiceClient()
  const { error } = await serviceClient.from('feed_posts').delete().eq('id', id)
  if (error) {
    console.error('Feed post delete error:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
