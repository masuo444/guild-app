import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from './ProfileForm'
import { ProfilePageHeader } from './ProfilePageClient'

export default async function ProfilePage() {
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

  const { count: renewalCount } = await supabase
    .from('activity_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('type', 'Renewal Bonus')

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <ProfilePageHeader />
      <ProfileForm profile={profile} email={user.email || ''} renewalCount={renewalCount ?? 0} />
    </div>
  )
}
