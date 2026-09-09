import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getRegionSummaries, archiveTotal } from '@/lib/archive'
import { ArchiveHome } from '@/components/archive/ArchiveHome'

export default async function ArchivePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/app/archive')
  return <ArchiveHome regions={getRegionSummaries()} total={archiveTotal()} />
}
