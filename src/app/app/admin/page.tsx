import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminDashboard } from './AdminDashboard'

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
  ] = await Promise.all([
    supabase
      .from('invites')
      .select('*, profiles:used_by(display_name)')
      .order('created_at', { ascending: false })
      .limit(20),
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
  ])

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Admin Panel</h1>

      <AdminDashboard
        invites={invites ?? []}
        members={members ?? []}
        hubs={hubs ?? []}
        questSubmissions={questSubmissions ?? []}
        quests={quests ?? []}
        adminId={user.id}
        adminEmail={user.email || ''}
      />
    </div>
  )
}
