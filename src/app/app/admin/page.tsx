import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AdminDashboard } from './AdminDashboard'

// ギルドメンバー限定表示コンポーネント
function GuildMemberOnlyPage({ title }: { title: string }) {
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">{title}</h1>

      <div className="bg-white/10 backdrop-blur rounded-xl p-8 border border-zinc-500/30 text-center">
        <svg className="w-16 h-16 mx-auto mb-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h2 className="text-xl font-semibold text-white mb-2">Guild Member Only</h2>
        <p className="text-zinc-400 mb-6">
          この機能はギルドメンバー限定です。<br />
          ギルドに参加して全機能をご利用ください。
        </p>
        <Link
          href="/auth/login"
          className="inline-block px-8 py-3 bg-[#c0c0c0] text-zinc-900 font-medium rounded-lg hover:bg-white transition-colors"
        >
          Join Guild
        </Link>
      </div>
    </div>
  )
}

interface Props {
  searchParams: Promise<{ demo?: string }>
}

export default async function AdminPage(props: Props) {
  const searchParams = await props.searchParams
  const isDemo = searchParams?.demo === 'true'

  // デモモードの場合はギルドメンバー限定表示
  if (isDemo) {
    return <GuildMemberOnlyPage title="Admin Panel" />
  }

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
