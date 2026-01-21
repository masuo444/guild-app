import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SuperAdminDashboard } from './SuperAdminDashboard'
import { SUPER_ADMIN_EMAIL } from '@/config/admin'

export default async function SuperAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // スーパー管理者のみアクセス可能
  if (user.email !== SUPER_ADMIN_EMAIL) {
    redirect('/app')
  }

  // 全てのクエリを並列実行
  const [
    { data: members },
    { data: hubs },
    { data: invites },
    { data: offers },
    { data: customRoles },
    { data: memberRoles },
    { data: quests },
    { data: questSubmissions },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('masu_hubs')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('invites')
      .select('*, profiles:used_by(display_name)')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('guild_offers')
      .select('*, profiles:provider_id(display_name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('custom_roles')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('member_roles')
      .select('*'),
    supabase
      .from('guild_quests')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('quest_submissions')
      .select('*, guild_quests(title, points_reward), profiles:user_id(display_name, membership_id)')
      .order('status', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Super Admin Panel</h1>
        <p className="text-zinc-400 text-sm">Full access to all system features</p>
      </div>

      <SuperAdminDashboard
        members={members ?? []}
        hubs={hubs ?? []}
        invites={invites ?? []}
        offers={offers ?? []}
        customRoles={customRoles ?? []}
        memberRoles={memberRoles ?? []}
        quests={quests ?? []}
        questSubmissions={questSubmissions ?? []}
        adminId={user.id}
      />
    </div>
  )
}
