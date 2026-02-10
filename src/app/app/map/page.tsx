import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GuildMap } from '@/components/map/GuildMap'
import { canViewMembers } from '@/lib/access'
import { SubscriptionStatus, CustomRole } from '@/types/database'
import { MapPageHeader, MapUpgradeBanner, HubGridWithFilter } from '@/components/ui/LocalizedText'

export default async function MapPage() {
  const supabase = await createClient()

  // 現在のユーザーを取得
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
  const canSeeMembers = canViewMembers(subscriptionStatus)

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

  // 未使用招待（target_lat/lngが設定済み）をフェッチ → マップにpendingピン表示
  let pendingInvites: Array<{
    id: string
    code: string
    target_name: string | null
    target_country: string | null
    target_city: string | null
    target_lat: number
    target_lng: number
    membership_type: string
  }> = []

  if (canSeeMembers) {
    const { data: inviteData } = await supabase
      .from('invites')
      .select('id, code, target_name, target_country, target_city, target_lat, target_lng, membership_type, used, reusable')
      .not('target_lat', 'is', null)
      .not('target_lng', 'is', null)

    // 未使用の招待のみ（reusableは除外：一般公開リンクなので）
    pendingInvites = (inviteData ?? [])
      .filter(i => !i.reusable && !i.used)
      .map(i => ({
        id: i.id,
        code: i.code,
        target_name: i.target_name,
        target_country: i.target_country,
        target_city: i.target_city,
        target_lat: i.target_lat!,
        target_lng: i.target_lng!,
        membership_type: i.membership_type,
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

      {/* 無料ユーザー向けアップグレードバナー */}
      {!canSeeMembers && <MapUpgradeBanner />}

      <GuildMap
        members={members}
        hubs={hubs ?? []}
        pendingInvites={pendingInvites}
        userId={user?.id}
        canViewMembers={canSeeMembers}
      />

      {/* MASU Hubs 一覧セクション */}
      <div className="mt-6">
        <HubGridWithFilter hubs={(hubs ?? []).map(h => ({
          id: h.id,
          name: h.name,
          description: h.description,
          country: h.country,
          city: h.city,
          image_url: h.image_url,
        }))} />
      </div>
    </div>
  )
}
