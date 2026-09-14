import type { MetadataRoute } from 'next'
import { getPublicArticles, getPublicRegionSummaries } from '@/lib/archive'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://guild.fomusglobal.com'

// robots.txt が参照する sitemap。ログイン不要で見られる公開ページだけを載せる
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const base: MetadataRoute.Sitemap = [
    { url: `${APP_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${APP_URL}/archive`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${APP_URL}/guide`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${APP_URL}/auth/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  // 公開している地域ページと記事ページ（PUBLIC_ARCHIVE_IDS を増やせばここも自動で増える）
  const regions: MetadataRoute.Sitemap = getPublicRegionSummaries().map((r) => ({
    url: `${APP_URL}/archive/${r.key}`, lastModified: now, changeFrequency: 'monthly', priority: 0.8,
  }))
  const posts: MetadataRoute.Sitemap = getPublicArticles().map((a) => ({
    url: `${APP_URL}/archive/post/${a.id}`, lastModified: now, changeFrequency: 'yearly', priority: 0.7,
  }))

  return [...base, ...regions, ...posts]
}
