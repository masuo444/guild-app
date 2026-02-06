import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from './ProfileForm'
import { GuildMemberOnlyPage } from '@/components/ui/LocalizedText'
import { ProfilePageHeader } from './ProfilePageClient'

interface Props {
  searchParams: Promise<{ demo?: string }>
}

export default async function ProfilePage(props: Props) {
  const searchParams = await props.searchParams
  const isDemo = searchParams?.demo === 'true'

  // デモモードの場合はギルドメンバー限定表示
  if (isDemo) {
    return <GuildMemberOnlyPage titleKey="profileSettings" />
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/login')
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <ProfilePageHeader />
      <ProfileForm profile={profile} email={user.email || ''} />
    </div>
  )
}
