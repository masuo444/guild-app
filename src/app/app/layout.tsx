import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SUPER_ADMIN_EMAIL } from '@/config/admin'
import { AppLayoutClient } from './AppLayoutClient'
import { redirect } from 'next/navigation'
import { hasFullAccess } from '@/lib/access'
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
  let readerOnly = true

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, subscription_status, display_name, home_country, home_city, stripe_subscription_id')
      .eq('id', user.id)
      .single()

    isAdmin = profile?.role === 'admin'
    isSuperAdmin = user.email === SUPER_ADMIN_EMAIL

    // 半オープン化: 無料登録(free_tier)も /app に入れる。
    // マップ等の有料機能はページ側で access.ts のゲートにより制限する。
    // active/free/free_tier いずれでもない（inactive/past_due/canceled）場合のみ
    // アップグレード導線へ誘導する。
    let subscriptionStatus = profile?.subscription_status

    // 自己修復: 登録途中で切れて 'inactive'（トリガー初期値）のまま残った無料登録者は、
    // 決済履歴が無い限り無料会員(free_tier)として扱う（課金画面に閉じ込めない）
    if (!isAdmin && !isSuperAdmin && subscriptionStatus === 'inactive' && !profile?.stripe_subscription_id) {
      const { error } = await createServiceClient()
        .from('profiles')
        .update({ subscription_status: 'free_tier', membership_status: 'active' })
        .eq('id', user.id)
        .is('stripe_subscription_id', null)
      if (!error) subscriptionStatus = 'free_tier'
    }
    readerOnly = !isAdmin && !isSuperAdmin && !hasFullAccess(subscriptionStatus || 'free_tier')
    const hasAccess = isAdmin || isSuperAdmin
      || subscriptionStatus === 'active'
      || subscriptionStatus === 'free'
      || subscriptionStatus === 'free_tier'

    if (!hasAccess) {
      redirect('/auth/subscribe')
    }

    // プロフィール完成チェック: 表示名だけあればOK（国・市は任意。あとからマイページで設定できる）
    const isProfileComplete = !!profile?.display_name
    const headersList = await headers()
    const pathname = headersList.get('x-pathname') || ''

    if (!readerOnly && !isProfileComplete && pathname !== '/app/onboarding') {
      redirect('/app/onboarding')
    }
  }

  return (
    <AppLayoutClient isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} readerOnly={readerOnly}>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </AppLayoutClient>
  )
}
