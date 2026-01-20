import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
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
