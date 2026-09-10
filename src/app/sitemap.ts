import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://guild.fomusglobal.com'

// robots.txt が参照する sitemap。ログイン不要で見られる公開ページだけを載せる
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: `${APP_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${APP_URL}/guide`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${APP_URL}/auth/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
