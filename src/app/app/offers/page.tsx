import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SubscriptionStatus } from '@/types/database'
import { canViewOffers } from '@/lib/access'
import { OffersContent } from './OffersContent'
import { OffersPageHeader, OffersUpgradeView } from './OffersPageClient'

export default async function OffersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // ユーザーのプロフィールを取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single()

  const subscriptionStatus = (profile?.subscription_status || 'free_tier') as SubscriptionStatus
  const canSeeOffers = canViewOffers(subscriptionStatus)

  // 無料ユーザーはアップグレード画面を表示
  if (!canSeeOffers) {
    return <OffersUpgradeView />
  }

  // 全てのクエリを並列実行
  const [
    { data: quests },
    { data: submissions },
    { data: exchangeItems },
    { data: exchangeOrders },
    { data: allLogs },
  ] = await Promise.all([
    supabase
      .from('guild_quests')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('quest_submissions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('exchange_items')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('exchange_orders')
      .select('*, exchange_items(name, name_en)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('activity_logs')
      .select('points')
      .eq('user_id', user.id),
  ])

  const masuPoints = allLogs?.reduce((sum, log) => sum + (log.points || 0), 0) ?? 0

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <OffersPageHeader />

      <OffersContent
        quests={quests || []}
        submissions={submissions || []}
        userId={user.id}
        exchangeItems={exchangeItems || []}
        exchangeOrders={exchangeOrders || []}
        masuPoints={masuPoints}
      />
    </div>
  )
}
