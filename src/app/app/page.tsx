import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from './DashboardClient'

// 管理者メールアドレス
const ADMIN_EMAILS = ['keisukendo414@gmail.com']

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const isAdmin = ADMIN_EMAILS.includes(user.email || '')

  let profile = null
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  profile = profileData

  // 管理者でプロフィールがない場合、仮のプロフィールを作成
  if (!profile && isAdmin) {
    profile = {
      id: user.id,
      email: user.email,
      display_name: 'Admin',
      membership_id: 'ADMIN-001',
      membership_status: 'active',
      subscription_status: 'free',
      membership_type: 'staff',
      rank: 'bronze',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  if (!profile) {
    redirect('/auth/login')
  }

  // ポイント合計を取得
  const { data: logs } = await supabase
    .from('activity_logs')
    .select('points')
    .eq('user_id', user.id)

  const totalPoints = logs?.reduce((sum, log) => sum + log.points, 0) ?? 0

  // 最近のアクティビティ
  const { data: recentLogs } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <DashboardClient
      profile={profile}
      totalPoints={totalPoints}
      recentLogs={recentLogs ?? []}
    />
  )
}
