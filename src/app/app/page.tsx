import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // プロフィールを取得
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // プロフィールがない場合はデフォルト値を使用
  const profile = profileData || {
    id: user.id,
    email: user.email,
    display_name: user.email?.split('@')[0] || 'User',
    membership_id: `MBR-${user.id.slice(0, 8).toUpperCase()}`,
    membership_status: 'active',
    subscription_status: 'free',
    membership_type: 'standard',
    rank: 'bronze',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
