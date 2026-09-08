import { createServiceClient } from '@/lib/supabase/server'
import { makeExcerpt, readingMinutes } from '@/lib/feed'
import { LandingClient, LandingPost, LandingStats } from './LandingClient'

// ログイン前トップ。会員数・国数・拠点数・記事数と最新記事の抜粋を1時間ごとに再生成する
export const revalidate = 3600

const COUNTRY_ALIAS: Record<string, string> = {
  japan: 'Japan', '日本': 'Japan', nippon: 'Japan',
  usa: 'United States', 'united states': 'United States', 'u.s.': 'United States', america: 'United States',
  latvija: 'Latvia', uae: 'United Arab Emirates', 'united arab emirates': 'United Arab Emirates',
}
function normalizeCountry(raw: string | null): string | null {
  const s = (raw || '').trim()
  if (!s) return null
  return COUNTRY_ALIAS[s.toLowerCase()] ?? s
}

async function loadStats(): Promise<LandingStats> {
  try {
    const sb = createServiceClient()
    const [{ data: profiles }, { count: hubs }, { count: posts }] = await Promise.all([
      sb.from('profiles').select('home_country'),
      sb.from('masu_hubs').select('*', { count: 'exact', head: true }),
      sb.from('feed_posts').select('*', { count: 'exact', head: true }),
    ])
    const countries = new Set((profiles ?? []).map((p) => normalizeCountry(p.home_country)).filter(Boolean))
    return { members: profiles?.length ?? 0, countries: countries.size, hubs: hubs ?? 0, posts: posts ?? 0 }
  } catch {
    return { members: 0, countries: 0, hubs: 0, posts: 0 }
  }
}

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
  const [stats, posts] = await Promise.all([loadStats(), loadPosts()])
  return <LandingClient stats={stats} posts={posts} />
}
