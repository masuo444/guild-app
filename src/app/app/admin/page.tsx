import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminDashboard } from './AdminDashboard'
import { AdminPageHeader } from './AdminPageClient'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // 管理者権限をチェック
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/app')
  }

  // 全てのクエリを並列実行
  const [
    { data: invites },
    { data: members },
    { data: hubs },
    { data: questSubmissions },
    { data: quests },
    { data: activityLogs },
    { data: customRoles },
    { data: memberRoles },
    { data: exchangeItems },
    { data: exchangeOrders },
  ] = await Promise.all([
    supabase
      .from('invites')
      .select('*, inviter:invited_by(display_name, membership_id), invitee:used_by(display_name, membership_id)')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('masu_hubs')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('quest_submissions')
      .select('*, guild_quests(title, points_reward), profiles:user_id(display_name, membership_id)')
      .order('status', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('guild_quests')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('activity_logs')
      .select('user_id, points'),
    supabase
      .from('custom_roles')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('member_roles')
      .select('*'),
    supabase
      .from('exchange_items')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('exchange_orders')
      .select('*, exchange_items(name, points_cost, coupon_code), profiles:user_id(display_name, membership_id)')
      .order('created_at', { ascending: false }),
  ])

  // メンバーごとのポイントを集計
  const memberPoints: Record<string, number> = {}
  activityLogs?.forEach((log) => {
    memberPoints[log.user_id] = (memberPoints[log.user_id] || 0) + log.points
  })

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <AdminPageHeader />

      <AdminDashboard
        invites={invites ?? []}
        members={members ?? []}
        hubs={hubs ?? []}
        questSubmissions={questSubmissions ?? []}
        quests={quests ?? []}
        memberPoints={memberPoints}
        customRoles={customRoles ?? []}
        memberRoles={memberRoles ?? []}
        exchangeItems={exchangeItems ?? []}
        exchangeOrders={exchangeOrders ?? []}
        adminId={user.id}
        adminEmail={user.email || ''}
      />
    </div>
  )
}
