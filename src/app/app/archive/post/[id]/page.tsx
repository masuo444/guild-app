import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { hasFullAccess, ADMIN_EMAILS } from '@/lib/access'
import { SubscriptionStatus } from '@/types/database'
import { getArticle, getNeighbors, htmlTeaser, REGIONS } from '@/lib/archive'
import { ArchiveArticleView } from '@/components/archive/ArchiveArticleView'

export default async function ArchivePostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const numId = Number(id)
  const article = Number.isFinite(numId) ? getArticle(numId) : null
  if (!article) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?redirect=${encodeURIComponent(`/app/archive/post/${id}`)}`)
  const { data: profile } = await supabase.from('profiles').select('subscription_status, role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin' || ADMIN_EMAILS.includes(user.email as typeof ADMIN_EMAILS[number])
  const full = isAdmin || hasFullAccess((profile?.subscription_status || 'free_tier') as SubscriptionStatus)

  const region = REGIONS.find((r) => r.key === article.category) ?? { key: article.category, ja: article.category, en: article.category, emoji: '' }
  const { prev, next } = getNeighbors(article.id)
  // 無料会員には冒頭の段落だけ渡す（本文はサーバーで切る）
  const body = full ? article.body : htmlTeaser(article.body)
  const bodyEn = full ? article.body_en : article.body_en ? htmlTeaser(article.body_en) : null

  return (
    <ArchiveArticleView
      article={{ id: article.id, num: article.num, date: article.date, country: article.country, country_en: article.country_en, title: article.title, title_en: article.title_en, body, body_en: bodyEn }}
      region={region}
      teaser={!full}
      prev={prev ? { id: prev.id, title: prev.title, title_en: prev.title_en } : null}
      next={next ? { id: next.id, title: next.title, title_en: next.title_en } : null}
    />
  )
}
