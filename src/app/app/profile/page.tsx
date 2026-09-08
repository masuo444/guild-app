import { hasMemberAccess } from '@/lib/member-access'
import { ReaderAccount } from './ReaderAccount'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from './ProfileForm'
import { ProfilePageHeader } from './ProfilePageClient'
import { ProfileMenu } from './ProfileMenu'
import { ProfileHero } from './ProfileHero'
import { QuestionBox } from '@/components/QuestionBox'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  if (!await hasMemberAccess()) return <ReaderAccount email={user.email || ''} />

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/login')
  }

  const [{ count: renewalCount }, { data: allLogs }, { count: inviteCount }] = await Promise.all([
    supabase.from('activity_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('type', 'Renewal Bonus'),
    supabase.from('activity_logs').select('points, type').eq('user_id', user.id),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('invited_by', user.id),
  ])
  // ステータスポイント（交換で減らない）と枡ポイント（交換で減る）
  let statusPoints = 0, masuPoints = 0
  for (const log of allLogs || []) {
    masuPoints += log.points || 0
    if (log.type !== 'Point Exchange' && log.type !== 'Point Exchange Reversal') statusPoints += log.points || 0
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <ProfilePageHeader />
      <ProfileHero profile={profile} statusPoints={statusPoints} masuPoints={masuPoints} inviteCount={inviteCount ?? 0} />
      <ProfileMenu isAdmin={profile.role === 'admin'} />
      <div className="mb-6"><QuestionBox /></div>
      <ProfileForm profile={profile} email={user.email || ''} renewalCount={renewalCount ?? 0} />
    </div>
  )
}
