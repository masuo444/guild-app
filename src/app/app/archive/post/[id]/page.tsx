import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { getArticle, getNeighbors, REGIONS } from '@/lib/archive'
import { ArchiveArticleView } from '@/components/archive/ArchiveArticleView'

/**
 * 会員向けの海外アーカイブ。485本すべて全文で読める（無料会員も含む）。
 * 元々 masu-blog で公開していた記事であり、有料の価値は笛吹市の現在進行形の記録・
 * マップ・交換所・紹介報酬に置いているため、ここでは出し惜しみしない。
 */
export default async function ArchivePostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const numId = Number(id)
  const article = Number.isFinite(numId) ? getArticle(numId) : null
  if (!article) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?redirect=${encodeURIComponent(`/app/archive/post/${id}`)}`)

  const region = REGIONS.find((r) => r.key === article.category) ?? { key: article.category, ja: article.category, en: article.category, emoji: '' }
  const { prev, next } = getNeighbors(article.id)

  return (
    <ArchiveArticleView
      article={{ id: article.id, num: article.num, date: article.date, country: article.country, country_en: article.country_en, title: article.title, title_en: article.title_en, body: article.body, body_en: article.body_en }}
      region={region}
      teaser={false}
      prev={prev ? { id: prev.id, title: prev.title, title_en: prev.title_en } : null}
      next={next ? { id: next.id, title: next.title, title_en: next.title_en } : null}
    />
  )
}
