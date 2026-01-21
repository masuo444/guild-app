import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { GuildMap } from '@/components/map/GuildMap'
import { canViewMembers, canRegisterHub } from '@/lib/access'
import { SubscriptionStatus, CustomRole } from '@/types/database'

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
  let canAddHub = false
  let canAddShop = false

  if (user) {
    // ユーザーのプロフィールを取得
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, role')
      .eq('id', user.id)
      .single()

    subscriptionStatus = (profile?.subscription_status || 'free_tier') as SubscriptionStatus
    canSeeMembers = canViewMembers(subscriptionStatus)
    canAddHub = canRegisterHub(subscriptionStatus)

    // adminロールの場合はショップ追加可能
    const isAdmin = profile?.role === 'admin'

    // ambassadorロールをチェック
    const { data: memberRoles } = await supabase
      .from('member_roles')
      .select('role:custom_roles(name)')
      .eq('user_id', user.id)

    const hasAmbassadorRole = memberRoles?.some((mr: { role: { name: string } | { name: string }[] | null }) => {
      if (!mr.role) return false
      const role = Array.isArray(mr.role) ? mr.role[0] : mr.role
      return role?.name?.toLowerCase() === 'ambassador'
    }) ?? false

    canAddShop = isAdmin || hasAmbassadorRole
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
      .eq('membership_status', 'active')
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
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Guild Map</h1>
          <p className="text-zinc-300">
            {canSeeMembers
              ? 'Explore members and MASU Hubs around the world'
              : 'Explore MASU Hubs around the world'}
          </p>
        </div>
      </div>

      {/* デモモードバナー */}
      {isDemo && (
        <div className="mb-6 bg-gradient-to-r from-[#c0c0c0]/20 to-[#c0c0c0]/10 rounded-xl p-4 border border-[#c0c0c0]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#c0c0c0]/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[#c0c0c0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-white">Demo Mode</h3>
              <p className="text-xs text-zinc-400">
                MASU Hubsの場所をプレビューできます。メンバーの場所を見るにはギルドに参加してください。
              </p>
            </div>
            <Link
              href="/auth/login"
              className="px-4 py-2 bg-[#c0c0c0] text-zinc-900 rounded-lg text-sm font-medium hover:bg-white transition-colors flex-shrink-0"
            >
              Join Guild
            </Link>
          </div>
        </div>
      )}

      {/* 無料ユーザー向けアップグレードバナー */}
      {!isDemo && !canSeeMembers && (
        <div className="mb-6 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-xl p-4 border border-zinc-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#c0c0c0]/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-[#c0c0c0]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-white">Upgrade to see member locations</h3>
              <p className="text-xs text-zinc-400">
                Free members can only view MASU Hub locations. Upgrade to see all guild members on the map.
              </p>
            </div>
            <a
              href="/auth/subscribe"
              className="px-4 py-2 bg-[#c0c0c0] text-zinc-900 rounded-lg text-sm font-medium hover:bg-white transition-colors flex-shrink-0"
            >
              Upgrade
            </a>
          </div>
        </div>
      )}

      <GuildMap
        members={members}
        hubs={hubs ?? []}
        userId={user?.id ?? 'demo'}
        canViewMembers={canSeeMembers}
        canRegisterHub={canAddHub}
        canAddShop={canAddShop}
      />

      {/* MASU Hubs 一覧セクション */}
      <div className="mt-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-orange-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          MASU Hubs ({hubs?.length ?? 0})
        </h2>
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
