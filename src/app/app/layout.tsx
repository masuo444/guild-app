import { createClient } from '@/lib/supabase/server'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SUPER_ADMIN_EMAIL } from '@/config/admin'
import { AppLayoutClient } from './AppLayoutClient'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

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
      .select('role, subscription_status, display_name, home_country, home_city')
      .eq('id', user.id)
      .single()

    isAdmin = profile?.role === 'admin'
    isSuperAdmin = user.email === SUPER_ADMIN_EMAIL

    // 半オープン化: 無料登録(free_tier)も /app に入れる。
    // マップ等の有料機能はページ側で access.ts のゲートにより制限する。
    // active/free/free_tier いずれでもない（inactive/past_due/canceled）場合のみ
    // アップグレード導線へ誘導する。
    const subscriptionStatus = profile?.subscription_status
    const hasAccess = isAdmin || isSuperAdmin
      || subscriptionStatus === 'active'
      || subscriptionStatus === 'free'
      || subscriptionStatus === 'free_tier'

    if (!hasAccess) {
      redirect('/auth/subscribe')
    }

    // プロフィール完成チェック: display_name AND (home_country OR home_city) が必要
    const isProfileComplete = !!(profile?.display_name && (profile?.home_country || profile?.home_city))
    const headersList = await headers()
    const pathname = headersList.get('x-pathname') || ''

    if (!isProfileComplete && pathname !== '/app/onboarding') {
      redirect('/app/onboarding')
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
