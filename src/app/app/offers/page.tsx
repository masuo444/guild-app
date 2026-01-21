import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UpgradeBanner } from '@/components/ui/UpgradeBanner'
import { calculateRank } from '@/config/rank'
import { SubscriptionStatus } from '@/types/database'
import { canViewOffers } from '@/lib/access'
import { OffersContent } from './OffersContent'

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
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">Guild Offers & Quests</h1>
        <p className="text-zinc-300 mb-6">
          Exclusive benefits and challenges for members
        </p>
        <UpgradeBanner
          title="Upgrade to Access Offers & Quests"
          description="Guild offers and quests are exclusive to paid members. Upgrade your membership to access discounts, special challenges, and more benefits."
          buttonText="Upgrade Membership"
          fullScreen
        />
      </div>
    )
  }

  // 全てのクエリを並列実行
  const [
    { data: logs },
    { data: offers },
    { data: quests },
    { data: submissions },
  ] = await Promise.all([
    supabase
      .from('activity_logs')
      .select('points')
      .eq('user_id', user.id),
    supabase
      .from('guild_offers')
      .select('*, profiles:provider_id(display_name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
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
  ])

  const totalPoints = logs?.reduce((sum, log) => sum + log.points, 0) ?? 0
  const userRank = calculateRank(totalPoints)

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Guild Offers & Quests</h1>
      <p className="text-zinc-300 mb-6">
        Exclusive benefits and challenges for members (Your Rank: {userRank})
      </p>

      <OffersContent
        offers={offers || []}
        quests={quests || []}
        submissions={submissions || []}
        userRank={userRank}
        userId={user.id}
      />
    </div>
  )
}
