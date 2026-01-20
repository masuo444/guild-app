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

  // 招待コード一覧
  const { data: invites } = await supabase
    .from('invites')
    .select('*, profiles:used_by(display_name)')
    .order('created_at', { ascending: false })
    .limit(20)

  // メンバー一覧
  const { data: members } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  // 枡拠点一覧
  const { data: hubs } = await supabase
    .from('masu_hubs')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Admin Panel</h1>

      <AdminDashboard
        invites={invites ?? []}
        members={members ?? []}
        hubs={hubs ?? []}
        adminId={user.id}
      />
    </div>
  )
}
