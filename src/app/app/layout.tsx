import { createClient } from '@/lib/supabase/server'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SUPER_ADMIN_EMAIL } from '@/config/admin'
import { AppLayoutClient } from './AppLayoutClient'
import { redirect } from 'next/navigation'

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

    // サブスクリプションチェック: active/free以外かつadminでもない場合はリダイレクト
    const subscriptionStatus = profile?.subscription_status
    const hasAccess = isAdmin || isSuperAdmin
      || subscriptionStatus === 'active'
      || subscriptionStatus === 'free'

    if (!hasAccess) {
      redirect('/auth/subscribe')
    }
  }

  return (
    <AppLayoutClient isAdmin={isAdmin} isSuperAdmin={isSuperAdmin}>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </AppLayoutClient>
  )
}
