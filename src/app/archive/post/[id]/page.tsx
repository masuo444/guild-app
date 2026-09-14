import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getArticle, getNeighbors, isPublicArticle, getPublicArticles, REGIONS } from '@/lib/archive'
import { ArchiveArticleView } from '@/components/archive/ArchiveArticleView'
import { PublicArchiveCta } from '@/components/archive/PublicArchiveCta'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://guild.fomusglobal.com'

export function generateStaticParams() {
  return getPublicArticles().map((a) => ({ id: String(a.id) }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const article = getArticle(Number(id))
  if (!article || !isPublicArticle(article.id)) return {}
  const desc = (article.excerpt || '').slice(0, 150)
  return {
    title: `${article.title}`,
    description: desc,
    alternates: { canonical: `${APP_URL}/archive/post/${article.id}` },
    openGraph: {
      title: article.title,
      description: desc,
      url: `${APP_URL}/archive/post/${article.id}`,
      type: 'article',
      publishedTime: article.date,
      images: article.thumbnail ? [article.thumbnail] : undefined,
    },
  }
}

/**
 * ログイン不要で読める記事ページ。
 * 公開対象(PUBLIC_ARCHIVE_IDS)以外は404にする。残りは無料登録すれば /app/archive で読める。
 */
export default async function PublicArchivePostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const article = getArticle(Number(id))
  if (!article || !isPublicArticle(article.id)) notFound()

  const region = REGIONS.find((r) => r.key === article.category)
    ?? { key: article.category, ja: article.category, en: article.category, emoji: '' }

  // 前後の記事も公開分だけを辿れるようにする（非公開記事への行き止まりを作らない）
  const all = getNeighbors(article.id)
  const pub = (a: { id: number } | null) => (a && isPublicArticle(a.id) ? a : null)

  return (
    <>
      <ArchiveArticleView
        article={{
          id: article.id, num: article.num, date: article.date,
          country: article.country, country_en: article.country_en,
          title: article.title, title_en: article.title_en,
          body: article.body, body_en: article.body_en,
        }}
        region={region}
        teaser={false}
        prev={pub(all.prev) as never}
        next={pub(all.next) as never}
        basePath="/archive"
      />
      <PublicArchiveCta />
    </>
  )
}
