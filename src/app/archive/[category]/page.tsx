import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPublicArticlesByCategory, REGIONS } from '@/lib/archive'
import { ArchiveList } from '@/components/archive/ArchiveList'
import { PublicArchiveCta } from '@/components/archive/PublicArchiveCta'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://guild.fomusglobal.com'

export function generateStaticParams() {
  return REGIONS.map((r) => ({ category: r.key }))
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params
  const region = REGIONS.find((r) => r.key === category)
  if (!region) return {}
  const count = getPublicArticlesByCategory(category).length
  return {
    title: `${region.ja}での活動記録`,
    description: `枡を持って${region.ja}を歩いた記録を${count}本公開しています。現地での出会い、日本文化の伝え方、暮らしの記録。`,
    alternates: { canonical: `${APP_URL}/archive/${category}` },
    openGraph: { title: `${region.ja}での活動記録`, url: `${APP_URL}/archive/${category}`, type: 'website' },
  }
}

export default async function PublicArchiveCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const region = REGIONS.find((r) => r.key === category)
  if (!region) notFound()
  const items = getPublicArticlesByCategory(category)
  if (!items.length) notFound()
  return (
    <>
      <ArchiveList region={region} items={items} basePath="/archive" />
      <PublicArchiveCta />
    </>
  )
}
