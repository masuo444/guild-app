import { createClient } from '@/lib/supabase/server'
import { Navigation } from '@/components/ui/Navigation'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SUPER_ADMIN_EMAIL } from '@/config/admin'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 管理者権限をチェック
  let isAdmin = false
  let isSuperAdmin = false

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, subscription_status')
      .eq('id', user.id)
      .single()

    isAdmin = profile?.role === 'admin'
    isSuperAdmin = user.email === SUPER_ADMIN_EMAIL
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      <Navigation isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} />
      <main className="flex-1 pb-20 md:pb-0">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  )
}
