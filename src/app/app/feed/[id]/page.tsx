import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { hasFullAccess, ADMIN_EMAILS } from '@/lib/access'
import { SubscriptionStatus } from '@/types/database'
import { makeTeaser, readingMinutes } from '@/lib/feed'
import { ArticleClient, ArticlePost, NeighborPost } from './ArticleClient'

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?redirect=${encodeURIComponent(`/app/feed/${id}`)}`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, role')
    .eq('id', user.id)
    .single()

  const subscriptionStatus = (profile?.subscription_status || 'free_tier') as SubscriptionStatus
  const isAdmin = profile?.role === 'admin' || ADMIN_EMAILS.includes(user.email as typeof ADMIN_EMAILS[number])
  const canViewPremium = isAdmin || hasFullAccess(subscriptionStatus)

  const { data: row } = await supabase
    .from('feed_posts')
    .select('id, title, body, image_url, is_premium, published_at, category')
    .eq('id', id)
    .single()
  if (!row) notFound()

  // 有料・特別会員以外（無料会員）は全記事「冒頭＋最初の見出しまで」のプレビューのみ
  const teaser = !canViewPremium
  const locked = row.is_premium && !canViewPremium

  // 前後の記事（公開日順）
  const [{ data: newer }, { data: older }] = await Promise.all([
    supabase.from('feed_posts').select('id, title, published_at').gt('published_at', row.published_at).order('published_at', { ascending: true }).limit(1),
    supabase.from('feed_posts').select('id, title, published_at').lt('published_at', row.published_at).order('published_at', { ascending: false }).limit(1),
  ])

  const post: ArticlePost = {
    id: row.id,
    title: row.title,
    body: locked ? '' : teaser ? makeTeaser(row.body) : row.body,
    image_url: locked ? null : row.image_url,
    is_premium: row.is_premium,
    published_at: row.published_at,
    category: row.category ?? null,
    minutes: readingMinutes(row.body),
    locked,
    teaser,
  }
  const toNeighbor = (r: { id: string; title: string; published_at: string } | undefined): NeighborPost | null =>
    r ? { id: r.id, title: r.title, published_at: r.published_at } : null

  const { data: cats } = await supabase.from('feed_posts').select('category').not('category', 'is', null)
  const categories = Array.from(new Set((cats ?? []).map((c) => c.category as string))).sort()

  return (
    <ArticleClient
      post={post}
      newer={toNeighbor(newer?.[0])}
      older={toNeighbor(older?.[0])}
      isAdmin={isAdmin}
      categories={categories}
    />
  )
}
