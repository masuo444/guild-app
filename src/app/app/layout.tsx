import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navigation } from '@/components/ui/Navigation'

// 管理者メールアドレス
const ADMIN_EMAILS = ['keisukendo414@gmail.com']

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const isAdminEmail = ADMIN_EMAILS.includes(user.email || '')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, subscription_status, membership_status')
    .eq('id', user.id)
    .single()

  // 管理者メールはプロフィールなしでもOK
  if (!isAdminEmail && (!profile || (profile.subscription_status !== 'active' && profile.subscription_status !== 'free'))) {
    redirect('/auth/subscribe')
  }

  const isAdmin = isAdminEmail || profile?.role === 'admin'

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-zinc-50">
      <Navigation isAdmin={isAdmin} />
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}
