import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GuildMap } from '@/components/map/GuildMap'
import { canViewMembers } from '@/lib/access'
import { SubscriptionStatus, CustomRole } from '@/types/database'
import { MapPageHeader, MapDemoBanner, MapUpgradeBanner, MasuHubsSectionHeader } from '@/components/ui/LocalizedText'

interface Props {
  searchParams: Promise<{ demo?: string }>
}

export default async function MapPage(props: Props) {
  const searchParams = await props.searchParams
  const isDemo = searchParams?.demo === 'true'

  const supabase = await createClient()

  // 現在のユーザーを取得
  const { data: { user } } = await supabase.auth.getUser()

  // デモモードでない場合は認証必須
  if (!isDemo && !user) {
    redirect('/auth/login')
  }

  // デモモードの場合は制限付きアクセス
  let subscriptionStatus: SubscriptionStatus = 'free_tier'
  let canSeeMembers = false

  if (user) {
    // ユーザーのプロフィールを取得
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single()

    subscriptionStatus = (profile?.subscription_status || 'free_tier') as SubscriptionStatus
    canSeeMembers = canViewMembers(subscriptionStatus)
  }

  // メンバー情報は課金ユーザーのみ取得
  type MemberRole = {
    role_id: string
    role: CustomRole
  }

  let members: Array<{
    id: string
    display_name: string | null
    home_country: string | null
    home_city: string | null
    lat: number | null
    lng: number | null
    instagram_id: string | null
    avatar_url?: string | null
    roles?: MemberRole[]
  }> = []

  if (canSeeMembers) {
    const { data } = await supabase
      .from('profiles')
      .select(`
        id, display_name, home_country, home_city, lat, lng, instagram_id, avatar_url,
        member_roles (
          role_id,
          role:custom_roles (id, name, color, description, created_at)
        )
      `)
      .eq('show_location_on_map', true)
      .not('lat', 'is', null)
      .not('lng', 'is', null)

    // Transform data to match expected structure
    members = (data ?? []).map(m => ({
      ...m,
      roles: m.member_roles?.map((mr: { role_id: string; role: { id: string; name: string; color: string; description: string | null; created_at: string }[] }) => ({
        role_id: mr.role_id,
        role: Array.isArray(mr.role) ? mr.role[0] as CustomRole : mr.role as CustomRole
      })).filter((mr): mr is MemberRole => mr.role !== undefined)
    }))
  }

  // 枡拠点は全員取得可能
  const { data: hubs } = await supabase
    .from('masu_hubs')
    .select('*')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <MapPageHeader canSeeMembers={canSeeMembers} />
      </div>

      {/* デモモードバナー */}
      {isDemo && <MapDemoBanner />}

      {/* 無料ユーザー向けアップグレードバナー */}
      {!isDemo && !canSeeMembers && <MapUpgradeBanner />}

      <GuildMap
        members={members}
        hubs={hubs ?? []}
        userId={user?.id}
        canViewMembers={canSeeMembers}
      />

      {/* MASU Hubs 一覧セクション */}
      <div className="mt-6">
        <MasuHubsSectionHeader count={hubs?.length ?? 0} />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {(hubs ?? []).map((hub) => (
            <div
              key={hub.id}
              className="bg-white/10 backdrop-blur rounded-lg border border-zinc-500/30 overflow-hidden hover:border-orange-500/50 transition-colors"
            >
              {hub.image_url ? (
                <img
                  src={hub.image_url}
                  alt={hub.name}
                  className="w-full h-24 sm:h-32 object-cover"
                />
              ) : (
                <div className="w-full h-24 sm:h-32 bg-zinc-800 flex items-center justify-center">
                  <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
              <div className="p-2 sm:p-3">
                <h3 className="font-semibold text-white text-sm sm:text-base line-clamp-1">{hub.name}</h3>
                <p className="text-xs sm:text-sm text-zinc-400">
                  {hub.country}, {hub.city}
                </p>
                {hub.description && (
                  <p className="text-xs text-zinc-300 mt-1 line-clamp-1">{hub.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
