import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { hasMemberAccess } from '@/lib/member-access'
import { ADMIN_EMAILS } from '@/lib/access'
import { notifyAdminMessage } from '@/lib/notifications'

/**
 * 記事のリアクション（🙌）とコメント。会員（有料・特別・管理者）のみ。
 * テーブル未作成のときは available:false を返し、UIは何も出さない。
 */
type Ctx = { params: Promise<{ id: string }> }

async function ctx() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role, display_name').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin' || ADMIN_EMAILS.includes(user.email as typeof ADMIN_EMAILS[number])
  return { supabase, user, isAdmin, displayName: profile?.display_name || user.email?.split('@')[0] || 'member' }
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  if (!await hasMemberAccess()) return NextResponse.json({ error: 'Paid membership required' }, { status: 403 })
  const c = await ctx()
  if (!c) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const [{ data: reactions, error: rErr }, { data: comments, error: cErr }] = await Promise.all([
    c.supabase.from('feed_reactions').select('user_id').eq('post_id', id),
    c.supabase.from('feed_comments').select('id, user_id, body, created_at, profiles:user_id(display_name, avatar_url)').eq('post_id', id).order('created_at', { ascending: true }),
  ])
  if (rErr || cErr) {
    // マイグレーション未適用など
    return NextResponse.json({ available: false })
  }
  return NextResponse.json({
    available: true,
    reactions: reactions?.length ?? 0,
    reacted: (reactions ?? []).some((r) => r.user_id === c.user.id),
    comments: (comments ?? []).map((m) => {
      const p = (Array.isArray(m.profiles) ? m.profiles[0] : m.profiles) as { display_name: string | null; avatar_url: string | null } | null
      return { id: m.id, user_id: m.user_id, body: m.body, created_at: m.created_at, display_name: p?.display_name || 'member', avatar_url: p?.avatar_url || null, mine: m.user_id === c.user.id }
    }),
    isAdmin: c.isAdmin,
  })
}

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!await hasMemberAccess()) return NextResponse.json({ error: 'Paid membership required' }, { status: 403 })
  const c = await ctx()
  if (!c) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  let body: { action?: string; text?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (body.action === 'react') {
    const { error } = await c.supabase.from('feed_reactions').upsert({ post_id: id, user_id: c.user.id }, { onConflict: 'post_id,user_id', ignoreDuplicates: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }
  if (body.action === 'unreact') {
    const { error } = await c.supabase.from('feed_reactions').delete().eq('post_id', id).eq('user_id', c.user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }
  if (body.action === 'comment') {
    const text = (body.text || '').trim().slice(0, 1000)
    if (!text) return NextResponse.json({ error: 'empty' }, { status: 400 })
    const { data, error } = await c.supabase.from('feed_comments').insert({ post_id: id, user_id: c.user.id, body: text }).select('id').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    // 管理者にだけ知らせる（会員への通知は増やさない）
    const { data: post } = await createServiceClient().from('feed_posts').select('title').eq('id', id).single()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://guild-app.fomusglobal.com'
    notifyAdminMessage(`コメント: ${c.displayName}`, [`記事: ${post?.title ?? id}`, text, `${appUrl}/app/feed/${id}`]).catch(() => {})
    return NextResponse.json({ success: true, id: data.id })
  }
  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const c = await ctx()
  if (!c) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const commentId = req.nextUrl.searchParams.get('commentId')
  if (!commentId) return NextResponse.json({ error: 'commentId required' }, { status: 400 })
  // 本人はRLSで、管理者は service role で削除
  const client = c.isAdmin ? createServiceClient() : c.supabase
  const { error } = await client.from('feed_comments').delete().eq('id', commentId).eq('post_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
