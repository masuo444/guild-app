import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasFullAccess, ADMIN_EMAILS } from '@/lib/access'
import { SubscriptionStatus } from '@/types/database'
import { makeExcerpt, readingMinutes } from '@/lib/feed'
import { FeedClient, FeedListItem } from './FeedClient'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, role, lat')
    .eq('id', user.id)
    .single()

  const subscriptionStatus = (profile?.subscription_status || 'free_tier') as SubscriptionStatus
  const isAdmin = profile?.role === 'admin' || ADMIN_EMAILS.includes(user.email as typeof ADMIN_EMAILS[number])
  // 有料会員・特別会員・管理者は有料本文を閲覧できる
  const canViewPremium = isAdmin || hasFullAccess(subscriptionStatus)

  type Row = {
    id: string; title: string; body: string; image_url: string | null
    is_premium: boolean; published_at: string; category?: string | null
  }
  let rawPosts: Row[] | null = null
  const withCat = await supabase
    .from('feed_posts')
    .select('id, title, body, image_url, is_premium, published_at, category')
    .order('published_at', { ascending: false })
    .limit(300)
  if (withCat.error) {
    const withoutCat = await supabase
      .from('feed_posts')
      .select('id, title, body, image_url, is_premium, published_at')
      .order('published_at', { ascending: false })
      .limit(300)
    rawPosts = (withoutCat.data as Row[]) ?? []
  } else {
    rawPosts = (withCat.data as Row[]) ?? []
  }

  // 一覧には本文を送らず、抜粋と読了目安だけ渡す（有料記事は非対象ユーザーに抜粋も出さない）
  const posts: FeedListItem[] = rawPosts.map((p) => {
    const locked = p.is_premium && !canViewPremium
    return {
      id: p.id,
      title: p.title,
      excerpt: locked ? '' : makeExcerpt(p.body),
      minutes: readingMinutes(p.body),
      image_url: locked ? null : p.image_url,
      is_premium: p.is_premium,
      published_at: p.published_at,
      category: p.category ?? null,
      locked,
    }
  })

  const categories = Array.from(
    new Set(posts.map((p) => p.category).filter((c): c is string => !!c))
  ).sort()

  // 有料・特別会員でまだマップに位置が無い人にだけ「マップに載る」導線を出す
  const needsLocation = canViewPremium && !isAdmin && profile?.lat == null

  return (
    <FeedClient posts={posts} categories={categories} isAdmin={isAdmin} userId={user.id} needsLocation={needsLocation} />
  )
}
