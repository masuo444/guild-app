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

  if (user) {
    // ユーザーのプロフィールを取得
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single()

    subscriptionStatus = (profile?.subscription_status || 'free_tier') as SubscriptionStatus
    canSeeMembers = canViewMembers(subscriptionStatus)
    canAddHub = canRegisterHub(subscriptionStatus)
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
      />

      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        {canSeeMembers && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-green-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <span className="text-zinc-300">Members ({members.length})</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-orange-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span className="text-zinc-300">MASU Hubs ({hubs?.length ?? 0})</span>
        </div>
      </div>

      {/* MASU Hubs 一覧セクション */}
      <div className="mt-10">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          MASU Hubs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(hubs ?? []).map((hub) => (
            <div
              key={hub.id}
              className="bg-white/10 backdrop-blur rounded-xl border border-zinc-500/30 overflow-hidden hover:border-orange-500/50 transition-colors"
            >
              {hub.image_url ? (
                <img
                  src={hub.image_url}
                  alt={hub.name}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-zinc-800 flex items-center justify-center">
                  <svg className="w-12 h-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-white mb-1">{hub.name}</h3>
                <p className="text-sm text-zinc-400 mb-2">
                  {hub.city}, {hub.country}
                </p>
                {hub.description && (
                  <p className="text-sm text-zinc-300 mb-3 line-clamp-2">{hub.description}</p>
                )}
                {hub.address && (
                  <p className="text-xs text-zinc-400 mb-2 flex items-start gap-1">
                    <span className="flex-shrink-0">📍</span>
                    <span>{hub.address}</span>
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {hub.google_maps_url && (
                    <a
                      href={hub.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded-full text-xs text-white transition-colors"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      Map
                    </a>
                  )}
                  {hub.website_url && (
                    <a
                      href={hub.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded-full text-xs text-white transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
                      </svg>
                      Web
                    </a>
                  )}
                  {hub.phone && (
                    <a
                      href={`tel:${hub.phone}`}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded-full text-xs text-white transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                      </svg>
                      {hub.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
