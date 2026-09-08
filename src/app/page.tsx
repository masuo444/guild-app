import { createServiceClient } from '@/lib/supabase/server'
import { makeExcerpt, readingMinutes } from '@/lib/feed'
import { LandingClient, LandingPost } from './LandingClient'

// ログイン前トップ。最新記事の抜粋を1時間ごとに再生成する
export const revalidate = 3600

async function loadPosts(): Promise<LandingPost[]> {
  try {
    const sb = createServiceClient()
    const { data } = await sb
      .from('feed_posts')
      .select('id, title, body, published_at, is_premium')
      .eq('is_premium', false)
      .order('published_at', { ascending: false })
      .limit(3)
    // ログイン前には本文は出さない。タイトルと冒頭の抜粋だけ
    return (data ?? []).map((p) => ({
      id: p.id,
      title: p.title,
      excerpt: makeExcerpt(p.body, 110),
      minutes: readingMinutes(p.body),
      published_at: p.published_at,
    }))
  } catch {
    return []
  }
}

export default async function HomePage() {
  const posts = await loadPosts()
  return <LandingClient posts={posts} />
}
