import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './DashboardClient'
import { Profile } from '@/types/database'

export default async function DashboardPage() {
  // Supabaseから実データを取得
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 未ログインの場合はログインページへリダイレクト
  if (!user) {
    redirect('/auth/login')
  }

  // プロフィール取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // アクティビティログ取得
  const { data: logs } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // ポイント集計
  const totalPoints = logs?.reduce((sum, log) => sum + (log.points || 0), 0) ?? 0

  // 招待した人数を取得
  const { count: inviteCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('invited_by', user.id)

  // プロフィールがない場合のフォールバック
  const userProfile: Profile = profile || {
    id: user.id,
    display_name: user.email?.split('@')[0] || 'User',
    role: 'user',
    membership_status: 'pending',
    membership_type: 'free',
    membership_id: null,
    subscription_status: 'free_tier',
    stripe_customer_id: null,
    stripe_subscription_id: null,
    home_country: null,
    home_city: null,
    lat: null,
    lng: null,
    instagram_id: null,
    avatar_url: null,
    show_location_on_map: false,
    created_at: new Date().toISOString(),
  }

  return (
    <DashboardClient
      profile={userProfile}
      totalPoints={totalPoints}
      recentLogs={logs || []}
      inviteCount={inviteCount || 0}
    />
  )
}
