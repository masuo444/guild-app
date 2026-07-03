import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasFullAccess, ADMIN_EMAILS } from '@/lib/access'
import { SubscriptionStatus } from '@/types/database'
import { FeedClient, FeedPost } from './FeedClient'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, role')
    .eq('id', user.id)
    .single()

  const subscriptionStatus = (profile?.subscription_status || 'free_tier') as SubscriptionStatus
  const isAdmin = profile?.role === 'admin' || ADMIN_EMAILS.includes(user.email as typeof ADMIN_EMAILS[number])
  // 有料会員・特別会員・管理者は有料本文を閲覧できる
  const canViewPremium = isAdmin || hasFullAccess(subscriptionStatus)

  const { data: rawPosts } = await supabase
    .from('feed_posts')
    .select('id, title, body, image_url, is_premium, published_at')
    .order('published_at', { ascending: false })
    .limit(50)

  // 有料投稿は非対象ユーザーには本文・画像を伏せて返す（サーバー側ゲート）
  const posts: FeedPost[] = (rawPosts ?? []).map((p) => {
    const locked = p.is_premium && !canViewPremium
    return {
      id: p.id,
      title: p.title,
      body: locked ? '' : p.body,
      image_url: locked ? null : p.image_url,
      is_premium: p.is_premium,
      published_at: p.published_at,
      locked,
    }
  })

  return (
    <FeedClient posts={posts} isAdmin={isAdmin} userId={user.id} />
  )
}
