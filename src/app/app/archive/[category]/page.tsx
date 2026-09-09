import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { getArticlesByCategory, REGIONS } from '@/lib/archive'
import { ArchiveList } from '@/components/archive/ArchiveList'

export default async function ArchiveCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const region = REGIONS.find((r) => r.key === category)
  if (!region) notFound()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?redirect=${encodeURIComponent(`/app/archive/${category}`)}`)
  return <ArchiveList region={region} items={getArticlesByCategory(category)} />
}
