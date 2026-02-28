'use client'

import { useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Invite, Profile, MasuHub, Rank, MembershipType, MEMBERSHIP_TYPE_LABELS, isFreeMembershipType, FREE_MEMBERSHIP_TYPES, GuildQuest, QuestSubmission, CustomRole, MemberRole, RoleColor, ROLE_COLOR_OPTIONS, ExchangeItem, ExchangeOrder } from '@/types/database'
import { calculateRank, RANK_THRESHOLDS } from '@/config/rank'
import { canIssueFreeInvite } from '@/config/admin'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { generateInviteCode, formatDate } from '@/lib/utils'

// 拡張されたQuestSubmission型（リレーションデータ含む）
interface QuestSubmissionWithRelations extends QuestSubmission {
  guild_quests: { title: string; points_reward: number } | null
  profiles: { display_name: string | null; membership_id: string | null } | null
}

// 招待者・被招待者情報付きのInvite
interface InviteWithRelations extends Invite {
  inviter: { display_name: string | null; membership_id: string | null } | null
  invitee: { display_name: string | null; membership_id: string | null } | null
}

interface ExchangeOrderWithRelations extends ExchangeOrder {
  exchange_items: { name: string; points_cost: number; coupon_code: string | null } | null
  profiles: { display_name: string | null; membership_id: string | null } | null
}

interface AdminDashboardProps {
  invites: InviteWithRelations[]
  members: Profile[]
  hubs: MasuHub[]
  questSubmissions: QuestSubmissionWithRelations[]
  quests: GuildQuest[]
  memberPoints: Record<string, number>
  customRoles: CustomRole[]
  memberRoles: MemberRole[]
  exchangeItems: ExchangeItem[]
  exchangeOrders: ExchangeOrderWithRelations[]
  adminId: string
  adminEmail: string
}

type Tab = 'invites' | 'members' | 'roles' | 'hubs' | 'quests' | 'exchange' | 'notifications'

const TAB_LABELS: Record<Tab, string> = {
  invites: '招待コード',
  members: 'メンバー',
  roles: 'ロール',
  hubs: '拠点',
  quests: 'クエスト',
  exchange: '交換所',
  notifications: '通知',
}

const TAB_ICONS: Record<Tab, ReactNode> = {
  invites: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  members: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  roles: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
  hubs: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  quests: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  exchange: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  notifications: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
}

export function AdminDashboard({ invites, members, hubs, questSubmissions, quests, memberPoints, customRoles, memberRoles, exchangeItems, exchangeOrders, adminId, adminEmail }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('invites')

  // 承認待ちの投稿数
  const pendingCount = questSubmissions.filter(s => s.status === 'pending').length
  // 未使用招待 = 再利用可能 + 通常の未使用
  const reusableInviteCount = invites.filter(i => i.reusable).length
  const unusedRegularInviteCount = invites.filter(i => !i.reusable && !i.used).length
  const unusedInviteCount = reusableInviteCount + unusedRegularInviteCount

  return (
    <div>
      {/* 統計サマリー */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl p-4 border border-green-500/20">
          <p className="text-green-400 text-xs font-medium">メンバー数</p>
          <p className="text-2xl font-bold text-white">{members.length}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-xl p-4 border border-orange-500/20">
          <p className="text-orange-400 text-xs font-medium">拠点数</p>
          <p className="text-2xl font-bold text-white">{hubs.length}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-4 border border-blue-500/20">
          <p className="text-blue-400 text-xs font-medium">未使用招待</p>
          <p className="text-2xl font-bold text-white">{unusedInviteCount}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl p-4 border border-amber-500/20">
          <p className="text-amber-400 text-xs font-medium">承認待ち</p>
          <p className="text-2xl font-bold text-white">{pendingCount}</p>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="flex gap-1 mb-6 p-1 bg-white/5 rounded-xl overflow-x-auto">
        {(['invites', 'members', 'roles', 'hubs', 'quests', 'exchange', 'notifications'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-0 px-3 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center justify-center gap-2 ${
              activeTab === tab
                ? 'bg-[#c0c0c0] text-zinc-900 shadow-lg'
                : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {TAB_ICONS[tab]}
            <span className="hidden sm:inline">{TAB_LABELS[tab]}</span>
            {tab === 'quests' && pendingCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                activeTab === tab ? 'bg-zinc-900/30 text-zinc-900' : 'bg-amber-500 text-amber-900'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* コンテンツ */}
      {activeTab === 'invites' && <InvitesTab invites={invites} adminId={adminId} adminEmail={adminEmail} />}
      {activeTab === 'members' && <MembersTab members={members} memberPoints={memberPoints} customRoles={customRoles} memberRoles={memberRoles} />}
      {activeTab === 'roles' && <RolesTab customRoles={customRoles} memberRoles={memberRoles} members={members} />}
      {activeTab === 'hubs' && <HubsTab hubs={hubs} />}
      {activeTab === 'quests' && <QuestsTab submissions={questSubmissions} quests={quests} adminId={adminId} />}
      {activeTab === 'exchange' && <ExchangeAdminTab items={exchangeItems} orders={exchangeOrders} adminId={adminId} />}
      {activeTab === 'notifications' && <NotificationsTab />}
    </div>
  )
}

function InvitesTab({ invites: initialInvites, adminId, adminEmail }: { invites: AdminDashboardProps['invites']; adminId: string; adminEmail: string }) {
  const [invites, setInvites] = useState(initialInvites)
  const [creating, setCreating] = useState(false)
  const [selectedType, setSelectedType] = useState<MembershipType>('standard')
  const [isReusable, setIsReusable] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [lastCreatedCode, setLastCreatedCode] = useState<string | null>(null)
  const [targetName, setTargetName] = useState('')
  const [targetCountry, setTargetCountry] = useState('')
  const [targetCity, setTargetCity] = useState('')
  const [targetLat, setTargetLat] = useState<number | null>(null)
  const [targetLng, setTargetLng] = useState<number | null>(null)
  const [geocodeStatus, setGeocodeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  // 無料招待を発行できるか
  const canCreateFreeInvite = canIssueFreeInvite(adminEmail)

  // 利用可能なメンバータイプ
  const availableMembershipTypes: MembershipType[] = canCreateFreeInvite
    ? ['standard', ...FREE_MEMBERSHIP_TYPES]
    : ['standard']

  const handleReusableChange = (checked: boolean) => {
    setIsReusable(checked)
  }

  // ジオコーディング（国・都市から座標取得）
  const geocodeInviteTarget = async (city: string, country: string): Promise<{ lat: number; lng: number } | null> => {
    if (!city && !country) return null
    const query = [city, country].filter(Boolean).join(', ')
    try {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        query
      )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      const response = await fetch(geocodeUrl)
      const data = await response.json()
      if (data.results && data.results[0]) {
        return {
          lat: data.results[0].geometry.location.lat,
          lng: data.results[0].geometry.location.lng,
        }
      }
    } catch {
      // Geocoding failed
    }
    return null
  }

  // 国・都市変更時にジオコーディング実行
  const handleGeocodePreview = async (city: string, country: string) => {
    if (!city.trim() && !country.trim()) {
      setTargetLat(null)
      setTargetLng(null)
      setGeocodeStatus('idle')
      return
    }
    setGeocodeStatus('loading')
    const result = await geocodeInviteTarget(city.trim(), country.trim())
    if (result) {
      setTargetLat(result.lat)
      setTargetLng(result.lng)
      setGeocodeStatus('success')
    } else {
      setTargetLat(null)
      setTargetLng(null)
      setGeocodeStatus('error')
    }
  }

  const handleCreateInvite = async () => {
    setCreating(true)
    const supabase = createClient()
    const code = generateInviteCode()

    // 国・都市が入力されていてまだジオコーディングしていない場合、ここで実行
    let lat = targetLat
    let lng = targetLng
    if ((targetCity.trim() || targetCountry.trim()) && lat === null) {
      const result = await geocodeInviteTarget(targetCity.trim(), targetCountry.trim())
      if (result) {
        lat = result.lat
        lng = result.lng
      }
    }

    const { data, error } = await supabase.from('invites').insert({
      code,
      invited_by: adminId,
      used: false,
      membership_type: selectedType,
      reusable: isReusable,
      use_count: 0,
      target_name: targetName.trim() || null,
      target_country: targetCountry.trim() || null,
      target_city: targetCity.trim() || null,
      target_lat: lat,
      target_lng: lng,
    }).select().single()

    setCreating(false)

    if (error) {
      console.error('招待コード作成エラー:', error)
      alert(`エラー: ${error.message}`)
    } else if (data) {
      // ローカルステートに追加して即座に表示
      const newInvite = {
        ...data,
        inviter: null,
        invitee: null,
      }
      setInvites(prev => [newInvite, ...prev])
      setLastCreatedCode(code)
      setTargetName('')
      setTargetCountry('')
      setTargetCity('')
      setTargetLat(null)
      setTargetLng(null)
      setGeocodeStatus('idle')
      // コードをクリップボードにコピー
      const url = `${window.location.origin}/invite/${code}`
      navigator.clipboard.writeText(url)
    }
  }

  const copyToClipboard = (code: string) => {
    const url = `${window.location.origin}/invite/${code}`
    navigator.clipboard.writeText(url)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // 再利用可能な招待は常に「有効」として扱う
  const reusableInvites = invites.filter((i) => i.reusable)
  const unusedInvites = invites.filter((i) => !i.reusable && !i.used)
  const usedInvites = invites.filter((i) => !i.reusable && i.used)

  // メンバータイプに応じた背景色を取得
  const getTypeBgColor = (type: MembershipType) => {
    switch (type) {
      case 'ambassador': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'partner': return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
    }
  }

  return (
    <div className="space-y-4">
      {/* 新規作成カード */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-white text-lg">新しい招待コードを作成</h2>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">メンバータイプ</label>
              <select
                className="w-full px-4 py-3 border border-zinc-500/30 rounded-xl text-sm bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as MembershipType)}
              >
                {availableMembershipTypes.map((type) => (
                  <option key={type} value={type} className="bg-zinc-900">
                    {MEMBERSHIP_TYPE_LABELS[type]} {isFreeMembershipType(type) ? '(無料)' : '(有料)'}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreateInvite} loading={creating} className="w-full sm:w-auto px-6">
                コード発行
              </Button>
            </div>
          </div>
          {/* 無料メンバー向けプロフィール事前設定 */}
          {isFreeMembershipType(selectedType) && !isReusable && (
            <div className="mt-4 p-4 bg-white/5 border border-zinc-500/20 rounded-xl space-y-3">
              <p className="text-xs font-medium text-zinc-300">プロフィール事前設定（任意）</p>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">名前</label>
                <input
                  type="text"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  placeholder="例: Yuki"
                  className="w-full px-4 py-2.5 border border-zinc-500/30 rounded-xl text-sm bg-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-zinc-400 mb-1">国</label>
                  <input
                    type="text"
                    value={targetCountry}
                    onChange={(e) => setTargetCountry(e.target.value)}
                    onBlur={() => handleGeocodePreview(targetCity, targetCountry)}
                    placeholder="例: Japan"
                    className="w-full px-4 py-2.5 border border-zinc-500/30 rounded-xl text-sm bg-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-zinc-400 mb-1">都市</label>
                  <input
                    type="text"
                    value={targetCity}
                    onChange={(e) => setTargetCity(e.target.value)}
                    onBlur={() => handleGeocodePreview(targetCity, targetCountry)}
                    placeholder="例: Tokyo"
                    className="w-full px-4 py-2.5 border border-zinc-500/30 rounded-xl text-sm bg-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
                  />
                </div>
              </div>
              {geocodeStatus !== 'idle' && (
                <div className="mt-2">
                  {geocodeStatus === 'loading' && (
                    <p className="text-xs text-zinc-400">位置情報を取得中...</p>
                  )}
                  {geocodeStatus === 'success' && (
                    <p className="text-xs text-green-400">位置情報を取得しました（マップに表示されます）</p>
                  )}
                  {geocodeStatus === 'error' && (
                    <p className="text-xs text-yellow-400">位置情報の取得に失敗しました（登録後にプロフィールで設定可能）</p>
                  )}
                </div>
              )}
            </div>
          )}
          {/* 再利用可能チェックボックス */}
          <div className="mt-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={isReusable}
                onChange={(e) => handleReusableChange(e.target.checked)}
                className="w-5 h-5 rounded border-zinc-500/30 bg-white/10 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer"
              />
              <div>
                <span className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                  永久リンク（再利用可能）
                </span>
                <p className="text-xs text-zinc-400 mt-0.5">
                  外部サイト掲載用。何度でも使える招待リンクを作成します
                </p>
              </div>
            </label>
          </div>
          {!canCreateFreeInvite && !isReusable && (
            <p className="text-xs text-zinc-500 mt-3">
              ※ 無料招待コードはスーパー管理者のみ発行可能です
            </p>
          )}
          {lastCreatedCode && (
            <div className="mt-3 p-3 bg-green-500/20 border border-green-500/30 rounded-xl">
              <p className="text-green-300 text-sm font-medium">
                招待コード <span className="font-mono">{lastCreatedCode}</span> を作成しました！
              </p>
              <p className="text-green-400/70 text-xs mt-1">
                招待URLをクリップボードにコピーしました
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 永久リンク（再利用可能） */}
      {reusableInvites.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-white">永久リンク ({reusableInvites.length})</h2>
            <p className="text-xs text-zinc-400 mt-1">何度でも使える招待リンク</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reusableInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-bold text-white text-lg">{invite.code}</p>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                          永久
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        {formatDate(invite.created_at)} 作成 ・ <span className="text-cyan-400 font-medium">{invite.use_count || 0}回使用</span>
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(invite.code)}
                    className="min-w-[100px]"
                  >
                    {copiedCode === invite.code ? 'コピー完了!' : 'URLをコピー'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 未使用の招待コード */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-white">未使用の招待コード ({unusedInvites.length})</h2>
        </CardHeader>
        <CardContent>
          {unusedInvites.length === 0 ? (
            <p className="text-zinc-500 text-center py-6">未使用の招待コードはありません</p>
          ) : (
            <div className="space-y-2">
              {unusedInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-green-500/10 border border-green-500/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-bold text-white text-lg">{invite.code}</p>
                        {invite.membership_type && invite.membership_type !== 'standard' && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getTypeBgColor(invite.membership_type)}`}>
                            {MEMBERSHIP_TYPE_LABELS[invite.membership_type]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400">
                        {formatDate(invite.created_at)} 作成
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(invite.code)}
                    className="min-w-[100px]"
                  >
                    {copiedCode === invite.code ? 'コピー完了!' : 'URLをコピー'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 招待履歴（誰が誰を招待したか） */}
      {usedInvites.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-white">招待履歴 ({usedInvites.length})</h2>
            <p className="text-xs text-zinc-400 mt-1">誰が誰を招待したかの記録</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {usedInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="p-4 rounded-xl bg-white/5 border border-zinc-700/50"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* 招待者 */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">
                          {invite.inviter?.display_name || '不明'}
                        </p>
                        {invite.inviter?.membership_id && (
                          <p className="text-xs text-zinc-500 font-mono">{invite.inviter.membership_id}</p>
                        )}
                      </div>
                    </div>

                    {/* 矢印 */}
                    <div className="flex items-center justify-center sm:px-2">
                      <svg className="w-5 h-5 text-green-400 rotate-90 sm:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>

                    {/* 被招待者 */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">
                          {invite.invitee?.display_name || '不明'}
                        </p>
                        {invite.invitee?.membership_id && (
                          <p className="text-xs text-zinc-500 font-mono">{invite.invitee.membership_id}</p>
                        )}
                      </div>
                    </div>

                    {/* メタ情報 */}
                    <div className="sm:ml-auto flex items-center gap-2 text-xs text-zinc-500">
                      {invite.membership_type && invite.membership_type !== 'standard' && (
                        <span className={`px-1.5 py-0.5 rounded font-medium ${getTypeBgColor(invite.membership_type)}`}>
                          {MEMBERSHIP_TYPE_LABELS[invite.membership_type]}
                        </span>
                      )}
                      <span>{formatDate(invite.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MembersTab({ members, memberPoints: initialMemberPoints, customRoles, memberRoles }: { members: Profile[]; memberPoints: Record<string, number>; customRoles: CustomRole[]; memberRoles: MemberRole[] }) {
  const router = useRouter()
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null)
  const [points, setPoints] = useState('')
  const [note, setNote] = useState('')
  const [adding, setAdding] = useState(false)
  const [updatingMember, setUpdatingMember] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingPoints, setEditingPoints] = useState<Record<string, string>>({})
  const [localMemberPoints, setLocalMemberPoints] = useState<Record<string, number>>(initialMemberPoints)
  const [editingSerial, setEditingSerial] = useState<Record<string, string>>({})

  // メンバーに割り当てられたロールを取得
  const getMemberRoles = (memberId: string) => {
    const roleIds = memberRoles.filter(mr => mr.member_id === memberId).map(mr => mr.role_id)
    return customRoles.filter(cr => roleIds.includes(cr.id))
  }

  // ロールの割り当て/解除
  const handleToggleRole = async (memberId: string, roleId: string, isAssigned: boolean) => {
    setUpdatingMember(memberId)
    try {
      const supabase = createClient()

      if (isAssigned) {
        // 解除
        const { error } = await supabase
          .from('member_roles')
          .delete()
          .eq('member_id', memberId)
          .eq('role_id', roleId)

        if (error) {
          console.error('Role toggle error:', error)
          alert(`更新エラー: ${error.message}`)
          return
        }
      } else {
        // 割り当て
        const { error } = await supabase.from('member_roles').insert({
          member_id: memberId,
          role_id: roleId,
        })

        if (error) {
          console.error('Role toggle error:', error)
          alert(`更新エラー: ${error.message}`)
          return
        }
      }

      router.refresh()
    } catch (err) {
      console.error('Role toggle error:', err)
      alert('更新に失敗しました')
    } finally {
      setUpdatingMember(null)
    }
  }

  // ロール色を取得
  const getRoleColorClasses = (color: RoleColor) => {
    const option = ROLE_COLOR_OPTIONS.find(o => o.value === color)
    return option ? `${option.bg}/20 ${option.text}` : 'bg-zinc-500/20 text-zinc-300'
  }

  const handleAddPoints = async () => {
    if (!selectedMember || !points) return
    setAdding(true)

    try {
      const res = await fetch('/api/admin/update-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedMember.id,
          points: parseInt(points),
          note: note || null,
          type: 'Admin Award',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        alert(`エラー: ${data.error}`)
        return
      }

      // ページを更新してサーバーから最新データを取得
      router.refresh()

      setSelectedMember(null)
      setPoints('')
      setNote('')
    } catch (err) {
      alert('ポイント付与に失敗しました')
    } finally {
      setAdding(false)
    }
  }

  const handleRoleChange = async (memberId: string, newRole: 'member' | 'admin') => {
    setUpdatingMember(memberId)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', memberId)

      if (error) {
        console.error('Role update error:', error)
        alert(`更新エラー: ${error.message}`)
      } else {
        router.refresh()
      }
    } catch (err) {
      console.error('Role update error:', err)
      alert('更新に失敗しました')
    } finally {
      setUpdatingMember(null)
    }
  }

  const handleMembershipTypeChange = async (memberId: string, newType: MembershipType) => {
    setUpdatingMember(memberId)
    try {
      const supabase = createClient()

      // メンバータイプに応じてsubscription_statusも更新
      const subscriptionStatus = isFreeMembershipType(newType) ? 'free' : 'free_tier'

      const { error } = await supabase
        .from('profiles')
        .update({
          membership_type: newType,
          subscription_status: subscriptionStatus,
        })
        .eq('id', memberId)

      if (error) {
        console.error('Membership type update error:', error)
        alert(`更新エラー: ${error.message}`)
      } else {
        router.refresh()
      }
    } catch (err) {
      console.error('Membership type update error:', err)
      alert('更新に失敗しました')
    } finally {
      setUpdatingMember(null)
    }
  }

  const handleRankChange = async (memberId: string, currentPoints: number, targetRank: Rank) => {
    setUpdatingMember(memberId)
    try {
      const targetPoints = RANK_THRESHOLDS[targetRank]
      const pointsDiff = targetPoints - currentPoints

      if (pointsDiff === 0) {
        setUpdatingMember(null)
        return
      }

      const res = await fetch('/api/admin/update-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: memberId,
          points: pointsDiff,
          note: `ランク${targetRank}に調整`,
          type: 'Rank Adjustment',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        console.error('Rank update error:', data.error)
        alert(`更新エラー: ${data.error}`)
      } else {
        router.refresh()
      }
    } catch (err) {
      console.error('Rank update error:', err)
      alert('更新に失敗しました')
    } finally {
      setUpdatingMember(null)
    }
  }

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (!confirm(`「${memberName}」を完全に削除しますか？この操作は元に戻せません。`)) return
    setUpdatingMember(memberId)
    try {
      const res = await fetch('/api/admin/delete-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(`削除エラー: ${data.error}`)
      } else {
        router.refresh()
      }
    } catch {
      alert('削除に失敗しました')
    } finally {
      setUpdatingMember(null)
    }
  }

  const handleSubscriptionStatusChange = async (memberId: string, newStatus: 'active' | 'free') => {
    setUpdatingMember(memberId)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: newStatus })
        .eq('id', memberId)

      if (error) {
        console.error('Subscription status update error:', error)
        alert(`更新エラー: ${error.message}`)
      } else {
        router.refresh()
      }
    } catch (err) {
      console.error('Subscription status update error:', err)
      alert('更新に失敗しました')
    } finally {
      setUpdatingMember(null)
    }
  }

  const handleMembershipStatusChange = async (memberId: string, newStatus: 'active' | 'inactive') => {
    setUpdatingMember(memberId)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ membership_status: newStatus })
        .eq('id', memberId)

      if (error) {
        alert(`更新エラー: ${error.message}`)
      } else {
        router.refresh()
      }
    } catch (err) {
      alert('更新に失敗しました')
    } finally {
      setUpdatingMember(null)
    }
  }

  const handleDirectPointsChange = async (memberId: string, currentPoints: number) => {
    const newPointsStr = editingPoints[memberId]
    if (newPointsStr === undefined || newPointsStr === '') return

    const newPoints = parseInt(newPointsStr)
    if (isNaN(newPoints)) return

    const pointsDiff = newPoints - currentPoints
    if (pointsDiff === 0) {
      setEditingPoints(prev => {
        const updated = { ...prev }
        delete updated[memberId]
        return updated
      })
      return
    }

    setUpdatingMember(memberId)
    try {
      const res = await fetch('/api/admin/update-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: memberId,
          points: pointsDiff,
          note: `ポイントを${currentPoints}から${newPoints}に調整`,
          type: 'Admin Adjustment',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        alert(`更新エラー: ${data.error}`)
      } else {
        // ページを更新してサーバーから最新データを取得
        setEditingPoints(prev => {
          const updated = { ...prev }
          delete updated[memberId]
          return updated
        })
        router.refresh()
      }
    } catch (err) {
      alert('更新に失敗しました')
    } finally {
      setUpdatingMember(null)
    }
  }

  const handleSerialNumberChange = async (memberId: string) => {
    const newSerial = editingSerial[memberId]
    if (newSerial === undefined) return

    setUpdatingMember(memberId)
    try {
      const res = await fetch('/api/admin/serial-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: memberId,
          serialNumber: newSerial === '' ? null : parseInt(newSerial),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        alert(`更新エラー: ${data.error}`)
      } else {
        setEditingSerial(prev => {
          const updated = { ...prev }
          delete updated[memberId]
          return updated
        })
        router.refresh()
      }
    } catch {
      alert('更新に失敗しました')
    } finally {
      setUpdatingMember(null)
    }
  }

  // 検索フィルタ
  const filteredMembers = members.filter((member) => {
    const query = searchQuery.toLowerCase()
    return (
      member.display_name?.toLowerCase().includes(query) ||
      member.membership_id?.toLowerCase().includes(query) ||
      member.home_city?.toLowerCase().includes(query) ||
      member.home_country?.toLowerCase().includes(query)
    )
  })

  const typeColors: Record<MembershipType, string> = {
    standard: 'bg-zinc-500/20 text-zinc-400',
    ambassador: 'bg-purple-500/20 text-purple-300',
    partner: 'bg-amber-500/20 text-amber-300',
  }

  const rankColors: Record<Rank, string> = {
    E: 'bg-gray-500/20 text-gray-300',
    D: 'bg-zinc-500/20 text-zinc-300',
    C: 'bg-green-500/20 text-green-300',
    B: 'bg-blue-500/20 text-blue-300',
    A: 'bg-amber-500/20 text-amber-300',
    S: 'bg-purple-500/20 text-purple-300',
    SS: 'bg-rose-500/20 text-rose-300',
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/20 text-green-300',
    free: 'bg-blue-500/20 text-blue-300',
  }

  const membershipStatusColors: Record<string, string> = {
    active: 'bg-green-500/20 text-green-300',
    inactive: 'bg-red-500/20 text-red-300',
  }

  return (
    <div className="space-y-4">
      {/* ポイント付与フォーム */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-white text-lg">ポイント付与</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">メンバー</label>
              <select
                className="w-full px-3 py-3 border border-zinc-500/30 rounded-xl text-sm bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
                value={selectedMember?.id || ''}
                onChange={(e) => {
                  const member = members.find((m) => m.id === e.target.value)
                  setSelectedMember(member || null)
                }}
              >
                <option value="" className="bg-zinc-900">選択してください</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id} className="bg-zinc-900">
                    {member.display_name || member.membership_id || '不明'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">ポイント数</label>
              <input
                type="number"
                placeholder="例: 100"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                className="w-full px-3 py-3 border border-zinc-500/30 rounded-xl text-sm bg-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">メモ (任意)</label>
              <input
                placeholder="例: イベント参加"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-3 border border-zinc-500/30 rounded-xl text-sm bg-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleAddPoints}
                loading={adding}
                disabled={!selectedMember || !points}
                className="w-full"
              >
                ポイント付与
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* メンバー一覧 */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="font-semibold text-white">メンバー一覧 ({members.length}人)</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-3 py-2 border border-zinc-500/30 rounded-lg text-sm bg-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredMembers.map((member) => {
              const memberType = member.membership_type || 'standard'
              const currentPoints = localMemberPoints[member.id] || 0
              const currentRank = calculateRank(currentPoints)
              const isUpdating = updatingMember === member.id

              const assignedRoles = getMemberRoles(member.id)

              return (
                <div key={member.id} className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  {/* 上段: 基本情報 */}
                  <div className="flex items-center gap-3 mb-3">
                    {/* アバター */}
                    <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-zinc-400 font-bold">
                          {(member.display_name || '?')[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white">
                          {member.display_name || '名前未設定'}
                        </span>
                        {/* カスタムロールバッジ */}
                        {assignedRoles.map(role => (
                          <span
                            key={role.id}
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColorClasses(role.color)}`}
                          >
                            {role.name}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5 flex-wrap">
                        <span className="font-mono">{member.membership_id || '-'}</span>
                        {member.serial_number != null && (
                          <>
                            <span>•</span>
                            <span className="font-mono">No.{String(member.serial_number).padStart(4, '0')}</span>
                          </>
                        )}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          member.subscription_status === 'active'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-zinc-600/30 text-zinc-400'
                        }`}>
                          {member.subscription_status === 'active' ? '有料' : '無料'}
                        </span>
                        <span>•</span>
                        <span>{currentPoints}pt</span>
                        {member.home_city && member.home_country && (
                          <>
                            <span>•</span>
                            <span>{member.home_city}, {member.home_country}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 中段: 設定項目 */}
                  <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 mb-3">
                    {/* ステータス */}
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">ステータス</label>
                      <select
                        value={member.subscription_status === 'active' ? 'active' : 'free'}
                        onChange={(e) => handleSubscriptionStatusChange(member.id, e.target.value as 'active' | 'free')}
                        disabled={isUpdating}
                        className={`w-full px-2 py-2 rounded-lg text-xs font-medium border border-zinc-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#c0c0c0] ${statusColors[member.subscription_status === 'active' ? 'active' : 'free']} ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <option value="active" className="bg-zinc-900">有料</option>
                        <option value="free" className="bg-zinc-900">無料</option>
                      </select>
                    </div>

                    {/* 権限 */}
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">権限</label>
                      <select
                        value={member.role || 'member'}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as 'member' | 'admin')}
                        disabled={isUpdating}
                        className={`w-full px-2 py-2 rounded-lg text-xs font-medium border border-zinc-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#c0c0c0] ${
                          member.role === 'admin'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-zinc-700 text-zinc-300'
                        } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <option value="member" className="bg-zinc-900">メンバー</option>
                        <option value="admin" className="bg-zinc-900">管理者</option>
                      </select>
                    </div>

                    {/* ポイント */}
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">ポイント</label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          value={editingPoints[member.id] !== undefined ? editingPoints[member.id] : currentPoints}
                          onChange={(e) => setEditingPoints(prev => ({ ...prev, [member.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur()
                              handleDirectPointsChange(member.id, currentPoints)
                            }
                          }}
                          disabled={isUpdating}
                          className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium border border-zinc-600 bg-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-[#c0c0c0] ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        {editingPoints[member.id] !== undefined && editingPoints[member.id] !== String(currentPoints) && (
                          <button
                            type="button"
                            onClick={() => handleDirectPointsChange(member.id, currentPoints)}
                            disabled={isUpdating}
                            className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded-lg disabled:opacity-50"
                          >
                            保存
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ギルドランク（自動計算） */}
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">ランク</label>
                      {(() => {
                        const displayPoints = editingPoints[member.id] !== undefined ? parseInt(editingPoints[member.id]) || 0 : currentPoints
                        const displayRank = calculateRank(displayPoints)
                        return (
                          <div className={`w-full px-2 py-2 rounded-lg text-xs font-medium border border-zinc-600 text-center ${rankColors[displayRank]}`}>
                            {displayRank} ({displayPoints}pt)
                          </div>
                        )
                      })()}
                    </div>

                    {/* メンバータイプ */}
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">タイプ</label>
                      <select
                        value={memberType}
                        onChange={(e) => handleMembershipTypeChange(member.id, e.target.value as MembershipType)}
                        disabled={isUpdating}
                        className={`w-full px-2 py-2 rounded-lg text-xs font-medium border border-zinc-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#c0c0c0] ${typeColors[memberType]} ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <option value="standard" className="bg-zinc-900">Standard (有料)</option>
                        <option value="ambassador" className="bg-zinc-900">Ambassador (無料)</option>
                        <option value="partner" className="bg-zinc-900">Partner (無料)</option>
                      </select>
                    </div>

                    {/* マップ表示 */}
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">マップ表示</label>
                      <select
                        value={member.membership_status || 'active'}
                        onChange={(e) => handleMembershipStatusChange(member.id, e.target.value as 'active' | 'inactive')}
                        disabled={isUpdating}
                        className={`w-full px-2 py-2 rounded-lg text-xs font-medium border border-zinc-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#c0c0c0] ${membershipStatusColors[member.membership_status || 'active']} ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <option value="active" className="bg-zinc-900">表示する</option>
                        <option value="inactive" className="bg-zinc-900">非表示</option>
                      </select>
                    </div>

                    {/* シリアルNo */}
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">シリアルNo</label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          placeholder="0001"
                          value={editingSerial[member.id] !== undefined ? editingSerial[member.id] : (member.serial_number ?? '')}
                          onChange={(e) => setEditingSerial(prev => ({ ...prev, [member.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur()
                              handleSerialNumberChange(member.id)
                            }
                          }}
                          disabled={isUpdating}
                          className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium border border-zinc-600 bg-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-[#c0c0c0] ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        {editingSerial[member.id] !== undefined && editingSerial[member.id] !== String(member.serial_number ?? '') && (
                          <button
                            type="button"
                            onClick={() => handleSerialNumberChange(member.id)}
                            disabled={isUpdating}
                            className="px-2 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded-lg disabled:opacity-50"
                          >
                            保存
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 下段: カスタムロール割り当て */}
                  {customRoles.length > 0 && (
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1.5">カスタムロール</label>
                      <div className="flex flex-wrap gap-1.5">
                        {customRoles.map(role => {
                          const isAssigned = assignedRoles.some(r => r.id === role.id)
                          return (
                            <button
                              key={role.id}
                              onClick={() => handleToggleRole(member.id, role.id, isAssigned)}
                              disabled={isUpdating}
                              className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                                isAssigned
                                  ? `${getRoleColorClasses(role.color)} ring-2 ring-white/30`
                                  : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                              } ${isUpdating ? 'opacity-50' : ''}`}
                            >
                              {role.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* 削除ボタン */}
                  <div className="mt-3 pt-3 border-t border-zinc-700/50 flex justify-end">
                    <button
                      onClick={() => handleDeleteMember(member.id, member.display_name || '名前未設定')}
                      disabled={isUpdating}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      メンバー削除
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          {filteredMembers.length === 0 && (
            <p className="text-zinc-500 text-center py-8">該当するメンバーが見つかりません</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function RolesTab({ customRoles, memberRoles, members }: { customRoles: CustomRole[]; memberRoles: MemberRole[]; members: Profile[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    color: 'blue' as RoleColor,
    description: '',
  })

  // 編集モード開始
  const startEdit = (role: CustomRole) => {
    setEditingRole(role)
    setFormData({
      name: role.name,
      color: role.color,
      description: role.description || '',
    })
    setShowForm(false)
  }

  // 編集キャンセル
  const cancelEdit = () => {
    setEditingRole(null)
    setFormData({ name: '', color: 'blue', description: '' })
  }

  // ロール作成
  const handleCreate = async () => {
    if (!formData.name) return
    setCreating(true)

    const supabase = createClient()
    await supabase.from('custom_roles').insert({
      name: formData.name,
      color: formData.color,
      description: formData.description || null,
    })

    setFormData({ name: '', color: 'blue', description: '' })
    setShowForm(false)
    router.refresh()
    setCreating(false)
  }

  // ロール更新
  const handleUpdate = async () => {
    if (!editingRole || !formData.name) return
    setCreating(true)

    const supabase = createClient()
    await supabase
      .from('custom_roles')
      .update({
        name: formData.name,
        color: formData.color,
        description: formData.description || null,
      })
      .eq('id', editingRole.id)

    setEditingRole(null)
    setFormData({ name: '', color: 'blue', description: '' })
    router.refresh()
    setCreating(false)
  }

  // ロール削除
  const handleDelete = async (roleId: string) => {
    if (!confirm('このロールを削除しますか？割り当てられているメンバーからも削除されます。')) return
    setDeleting(roleId)

    const supabase = createClient()
    // まず割り当てを削除
    await supabase.from('member_roles').delete().eq('role_id', roleId)
    // ロールを削除
    await supabase.from('custom_roles').delete().eq('id', roleId)

    router.refresh()
    setDeleting(null)
  }

  // ロールに割り当てられているメンバー数を取得
  const getMemberCount = (roleId: string) => {
    return memberRoles.filter(mr => mr.role_id === roleId).length
  }

  // 色クラスを取得
  const getColorClasses = (color: RoleColor) => {
    const option = ROLE_COLOR_OPTIONS.find(o => o.value === color)
    return option ? `${option.bg} text-white` : 'bg-zinc-500 text-white'
  }

  const getColorBgClasses = (color: RoleColor) => {
    const option = ROLE_COLOR_OPTIONS.find(o => o.value === color)
    return option ? `${option.bg}/20 ${option.text}` : 'bg-zinc-500/20 text-zinc-300'
  }

  // フォーム
  const renderForm = (isEdit: boolean) => (
    <div className="mb-6 p-4 bg-white/5 rounded-xl border border-zinc-500/20">
      <h3 className="font-medium text-white mb-4">{isEdit ? 'ロールを編集' : '新しいロールを作成'}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">名前 *</label>
          <input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="例: VIP, スタッフ, 初期メンバー"
            className="w-full px-3 py-3 border border-zinc-500/30 rounded-xl text-sm bg-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">色</label>
          <div className="flex flex-wrap gap-2">
            {ROLE_COLOR_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData({ ...formData, color: option.value })}
                className={`w-8 h-8 rounded-lg ${option.bg} transition-all ${
                  formData.color === option.value ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : 'opacity-60 hover:opacity-100'
                }`}
                title={option.label}
              />
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">説明 (任意)</label>
          <input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="ロールの説明"
            className="w-full px-3 py-3 border border-zinc-500/30 rounded-xl text-sm bg-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
          />
        </div>
        <div className="sm:col-span-2 flex gap-2">
          {isEdit ? (
            <>
              <Button onClick={handleUpdate} loading={creating} disabled={!formData.name}>
                更新
              </Button>
              <Button variant="outline" onClick={cancelEdit}>
                キャンセル
              </Button>
            </>
          ) : (
            <Button onClick={handleCreate} loading={creating} disabled={!formData.name}>
              ロールを作成
            </Button>
          )}
        </div>
      </div>
      {/* プレビュー */}
      {formData.name && (
        <div className="mt-4 pt-4 border-t border-zinc-700">
          <p className="text-xs text-zinc-500 mb-2">プレビュー</p>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getColorBgClasses(formData.color)}`}>
            {formData.name}
          </span>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h2 className="font-semibold text-white text-lg">カスタムロール管理</h2>
            <p className="text-xs text-zinc-400 mt-1">メンバーに割り当てるタグを作成・管理</p>
          </div>
          {!editingRole && (
            <Button size="sm" onClick={() => { setShowForm(!showForm); setEditingRole(null); }}>
              {showForm ? 'キャンセル' : '新規作成'}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {/* 新規作成フォーム */}
          {showForm && !editingRole && renderForm(false)}

          {/* 編集フォーム */}
          {editingRole && renderForm(true)}

          {/* ロール一覧 */}
          {customRoles.length > 0 ? (
            <div className="space-y-2">
              {customRoles.map(role => {
                const memberCount = getMemberCount(role.id)
                return (
                  <div
                    key={role.id}
                    className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-lg ${getColorClasses(role.color)} flex items-center justify-center flex-shrink-0`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-sm font-medium ${getColorBgClasses(role.color)}`}>
                          {role.name}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {memberCount}人に割り当て
                        </span>
                      </div>
                      {role.description && (
                        <p className="text-xs text-zinc-500 mt-1">{role.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => startEdit(role)}
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors"
                        title="編集"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(role.id)}
                        disabled={deleting === role.id}
                        className="p-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                        title="削除"
                      >
                        {deleting === role.id ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : !showForm && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <p className="text-zinc-500 mb-2">カスタムロールがありません</p>
              <button
                onClick={() => setShowForm(true)}
                className="text-[#c0c0c0] hover:text-white text-sm"
              >
                最初のロールを作成する →
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function HubsTab({ hubs }: { hubs: MasuHub[] }) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingHub, setEditingHub] = useState<MasuHub | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    country: '',
    city: '',
  })

  // 編集モードを開始
  const startEdit = (hub: MasuHub) => {
    setEditingHub(hub)
    setFormData({
      name: hub.name,
      description: hub.description || '',
      address: hub.address || '',
      country: hub.country,
      city: hub.city,
    })
    setShowForm(false)
  }

  // 編集をキャンセル
  const cancelEdit = () => {
    setEditingHub(null)
    setFormData({ name: '', description: '', address: '', country: '', city: '' })
  }

  const [autoFilling, setAutoFilling] = useState(false)

  // 住所から国・都市を自動取得
  const autoFillFromAddress = async () => {
    if (!formData.address) return
    setAutoFilling(true)

    try {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        formData.address
      )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`

      const response = await fetch(geocodeUrl)
      const data = await response.json()

      if (data.results && data.results[0]) {
        const components = data.results[0].address_components
        let country = ''
        let city = ''

        for (const component of components) {
          if (component.types.includes('country')) {
            country = component.long_name
          }
          if (component.types.includes('locality')) {
            city = component.long_name
          }
          // localityがない場合はadministrative_area_level_1を使用
          if (!city && component.types.includes('administrative_area_level_1')) {
            city = component.long_name
          }
        }

        setFormData(prev => ({
          ...prev,
          country: country || prev.country,
          city: city || prev.city,
        }))
      }
    } catch {
      // Failed to auto-fill
    }

    setAutoFilling(false)
  }

  // ジオコーディング処理（住所を含めて正確な位置を取得）
  const geocodeAddress = async (address: string, city: string, country: string) => {
    let lat = 0
    let lng = 0

    // 住所がある場合はフル住所で検索、なければ都市名で検索
    const searchQuery = address
      ? `${address}, ${city}, ${country}`
      : `${city}, ${country}`

    try {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        searchQuery
      )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`

      const response = await fetch(geocodeUrl)
      const data = await response.json()

      if (data.results && data.results[0]) {
        lat = data.results[0].geometry.location.lat
        lng = data.results[0].geometry.location.lng
      }
    } catch {
      // Geocoding failed - continue with default coordinates
    }

    return { lat, lng }
  }

  // 新規作成
  const handleCreate = async () => {
    if (!formData.name || !formData.country || !formData.city) return
    setCreating(true)

    const { lat, lng } = await geocodeAddress(formData.address, formData.city, formData.country)

    const supabase = createClient()
    await supabase.from('masu_hubs').insert({
      name: formData.name,
      description: formData.description || null,
      address: formData.address || null,
      country: formData.country,
      city: formData.city,
      lat,
      lng,
      is_active: true,
    })

    setFormData({ name: '', description: '', address: '', country: '', city: '' })
    setShowForm(false)
    router.refresh()
    setCreating(false)
  }

  // 更新
  const handleUpdate = async () => {
    if (!editingHub || !formData.name || !formData.country || !formData.city) return
    setUpdating(true)

    // 住所、都市、国のいずれかが変わった場合に再ジオコーディング
    let lat = editingHub.lat
    let lng = editingHub.lng
    if (
      formData.address !== (editingHub.address || '') ||
      formData.city !== editingHub.city ||
      formData.country !== editingHub.country
    ) {
      const coords = await geocodeAddress(formData.address, formData.city, formData.country)
      lat = coords.lat
      lng = coords.lng
    }

    const supabase = createClient()
    await supabase
      .from('masu_hubs')
      .update({
        name: formData.name,
        description: formData.description || null,
        address: formData.address || null,
        country: formData.country,
        city: formData.city,
        lat,
        lng,
      })
      .eq('id', editingHub.id)

    setEditingHub(null)
    setFormData({ name: '', description: '', address: '', country: '', city: '' })
    router.refresh()
    setUpdating(false)
  }

  // 削除
  const handleDelete = async (hubId: string) => {
    if (!confirm('この拠点を削除しますか？この操作は取り消せません。')) return
    setDeleting(hubId)

    const supabase = createClient()
    await supabase.from('masu_hubs').delete().eq('id', hubId)

    router.refresh()
    setDeleting(null)
  }

  // 有効/無効切り替え
  const handleToggleActive = async (hub: MasuHub) => {
    const supabase = createClient()
    await supabase
      .from('masu_hubs')
      .update({ is_active: !hub.is_active })
      .eq('id', hub.id)
    router.refresh()
  }

  const activeHubs = hubs.filter(h => h.is_active)
  const inactiveHubs = hubs.filter(h => !h.is_active)

  // 編集フォーム
  const renderForm = (isEdit: boolean) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 p-4 bg-white/5 rounded-xl border border-zinc-500/20">
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">名前 *</label>
        <input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="例: MASU Tokyo"
          className="w-full px-3 py-3 border border-zinc-500/30 rounded-xl text-sm bg-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">説明 (任意)</label>
        <input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="簡単な説明"
          className="w-full px-3 py-3 border border-zinc-500/30 rounded-xl text-sm bg-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">住所（入力すると国・都市を自動取得）</label>
        <div className="flex gap-2">
          <input
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="例: 東京都渋谷区神宮前1-2-3"
            className="flex-1 px-3 py-3 border border-zinc-500/30 rounded-xl text-sm bg-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
          />
          <button
            type="button"
            onClick={autoFillFromAddress}
            disabled={!formData.address || autoFilling}
            className="px-4 py-3 bg-blue-500/20 text-blue-300 rounded-xl text-sm font-medium hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {autoFilling ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
            自動取得
          </button>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">国 *</label>
        <input
          value={formData.country}
          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          placeholder="例: Japan"
          className="w-full px-3 py-3 border border-zinc-500/30 rounded-xl text-sm bg-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">都市 *</label>
        <input
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          placeholder="例: Tokyo"
          className="w-full px-3 py-3 border border-zinc-500/30 rounded-xl text-sm bg-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
        />
      </div>
      <div className="sm:col-span-2 flex gap-2">
        {isEdit ? (
          <>
            <Button onClick={handleUpdate} loading={updating} disabled={!formData.name || !formData.country || !formData.city}>
              更新
            </Button>
            <Button variant="outline" onClick={cancelEdit}>
              キャンセル
            </Button>
          </>
        ) : (
          <Button onClick={handleCreate} loading={creating} disabled={!formData.name || !formData.country || !formData.city}>
            拠点を作成
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="font-semibold text-white text-lg">MASU Hub 管理 ({hubs.length})</h2>
          {!editingHub && (
            <Button size="sm" onClick={() => { setShowForm(!showForm); setEditingHub(null); }}>
              {showForm ? 'キャンセル' : '新規追加'}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {/* 新規作成フォーム */}
          {showForm && !editingHub && renderForm(false)}

          {/* 編集フォーム */}
          {editingHub && renderForm(true)}

          {/* アクティブな拠点 */}
          <div className="space-y-2">
            {activeHubs.map((hub) => (
              <div
                key={hub.id}
                className="flex items-center gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-orange-500/20">
                  {hub.image_url ? (
                    <img src={hub.image_url} alt={hub.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{hub.name}</p>
                  <p className="text-sm text-zinc-400">
                    {hub.address ? `${hub.address}, ` : ''}{hub.city}, {hub.country}
                  </p>
                  {hub.description && (
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">{hub.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => startEdit(hub)}
                    className="p-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors"
                    title="編集"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleToggleActive(hub)}
                    className="p-2 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors"
                    title="無効化"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(hub.id)}
                    disabled={deleting === hub.id}
                    className="p-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    title="削除"
                  >
                    {deleting === hub.id ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 非アクティブな拠点 */}
          {inactiveHubs.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-700">
              <p className="text-xs text-zinc-500 mb-2">非アクティブ ({inactiveHubs.length})</p>
              <div className="space-y-2">
                {inactiveHubs.map((hub) => (
                  <div key={hub.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 opacity-60">
                    <div className="flex-1">
                      <p className="font-medium text-zinc-400">{hub.name}</p>
                      <p className="text-xs text-zinc-500">
                        {hub.address ? `${hub.address}, ` : ''}{hub.city}, {hub.country}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => startEdit(hub)}
                        className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors"
                        title="編集"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleToggleActive(hub)}
                        className="p-1.5 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors"
                        title="有効化"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(hub.id)}
                        disabled={deleting === hub.id}
                        className="p-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                        title="削除"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hubs.length === 0 && (
            <p className="text-zinc-500 text-center py-8">拠点がまだありません</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function OffersTab() {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState<{
    title: string
    description: string
    offer_type: string
    min_rank: Rank
  }>({
    title: '',
    description: '',
    offer_type: 'Discount',
    min_rank: 'D',
  })

  const handleCreate = async () => {
    if (!formData.title || !formData.description) return
    setCreating(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    await supabase.from('guild_offers').insert({
      title: formData.title,
      description: formData.description,
      offer_type: formData.offer_type,
      min_rank: formData.min_rank,
      provider_id: user.id,
      is_active: true,
    })

    setFormData({ title: '', description: '', offer_type: 'Discount', min_rank: 'D' })
    router.refresh()
    setCreating(false)
  }

  const offerTypes = [
    { value: 'Discount', label: '割引' },
    { value: 'Access', label: 'アクセス権' },
    { value: 'Service', label: 'サービス' },
    { value: 'Product', label: '商品' },
  ]

  const ranks = [
    { value: 'E', label: 'E (全メンバー)' },
    { value: 'D', label: 'D (30pt以上)' },
    { value: 'C', label: 'C (100pt以上)' },
    { value: 'B', label: 'B (300pt以上)' },
    { value: 'A', label: 'A (800pt以上)' },
    { value: 'S', label: 'S (2000pt以上)' },
    { value: 'SS', label: 'SS (5000pt以上)' },
  ]

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold text-white text-lg">新規オファーを作成</h2>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">タイトル *</label>
            <input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="オファーのタイトル"
              className="w-full px-3 py-3 border border-zinc-500/30 rounded-xl text-sm bg-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">タイプ</label>
            <select
              className="w-full px-3 py-3 border border-zinc-500/30 rounded-xl text-sm bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
              value={formData.offer_type}
              onChange={(e) => setFormData({ ...formData, offer_type: e.target.value })}
            >
              {offerTypes.map((type) => (
                <option key={type.value} value={type.value} className="bg-zinc-900">{type.label}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">説明 *</label>
            <textarea
              className="w-full px-3 py-3 border border-zinc-500/30 rounded-xl text-sm bg-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="オファーの詳細を入力..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">必要ランク</label>
            <select
              className="w-full px-3 py-3 border border-zinc-500/30 rounded-xl text-sm bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
              value={formData.min_rank}
              onChange={(e) => setFormData({ ...formData, min_rank: e.target.value as Rank })}
            >
              {ranks.map((rank) => (
                <option key={rank.value} value={rank.value} className="bg-zinc-900">{rank.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleCreate} loading={creating} disabled={!formData.title || !formData.description}>
              オファーを作成
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

type QuestType = 'photo' | 'checkin' | 'action'

function QuestsTab({ submissions, quests, adminId }: { submissions: QuestSubmissionWithRelations[]; quests: GuildQuest[]; adminId: string }) {
  const router = useRouter()
  const [processing, setProcessing] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showQuestForm, setShowQuestForm] = useState(false)
  const [creatingQuest, setCreatingQuest] = useState(false)
  const [togglingQuest, setTogglingQuest] = useState<string | null>(null)
  const [questFormData, setQuestFormData] = useState({
    title: '',
    description: '',
    points_reward: 10,
    quest_type: 'photo' as QuestType,
    is_repeatable: false,
  })

  // 承認待ち/それ以外で分ける
  const pendingSubmissions = submissions.filter(s => s.status === 'pending')
  const reviewedSubmissions = submissions.filter(s => s.status !== 'pending')

  // テキストを自動翻訳（日本語→英語）
  const autoTranslate = async (text: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, from: 'ja', to: 'en' }),
      })
      if (!res.ok) return null
      const data = await res.json()
      return data.translated || null
    } catch {
      return null
    }
  }

  // クエスト作成
  const handleCreateQuest = async () => {
    if (!questFormData.title || !questFormData.description) return
    setCreatingQuest(true)

    // 自動翻訳
    const [titleEn, descEn] = await Promise.all([
      autoTranslate(questFormData.title),
      autoTranslate(questFormData.description),
    ])

    const supabase = createClient()
    await supabase.from('guild_quests').insert({
      title: questFormData.title,
      description: questFormData.description,
      title_en: titleEn,
      description_en: descEn,
      points_reward: questFormData.points_reward,
      quest_type: questFormData.quest_type,
      is_repeatable: questFormData.is_repeatable,
      is_active: true,
      image_url: null,
    })

    setQuestFormData({
      title: '',
      description: '',
      points_reward: 10,
      quest_type: 'photo',
      is_repeatable: false,
    })
    setShowQuestForm(false)
    setCreatingQuest(false)
    router.refresh()
  }

  // クエストの有効/無効切り替え
  const handleToggleQuest = async (questId: string, currentStatus: boolean) => {
    setTogglingQuest(questId)
    const supabase = createClient()
    await supabase
      .from('guild_quests')
      .update({ is_active: !currentStatus })
      .eq('id', questId)
    setTogglingQuest(null)
    router.refresh()
  }

  const handleApprove = async (submission: QuestSubmissionWithRelations) => {
    if (!submission.guild_quests) return
    setProcessing(submission.id)

    const supabase = createClient()

    // 1. 投稿を承認
    await supabase
      .from('quest_submissions')
      .update({
        status: 'approved',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submission.id)

    // 2. ユーザーにポイントを付与
    await supabase.from('activity_logs').insert({
      user_id: submission.user_id,
      type: 'Quest Reward',
      points: submission.guild_quests.points_reward,
      note: `Quest: ${submission.guild_quests.title}`,
    })

    setProcessing(null)
    router.refresh()
  }

  const handleReject = async (submission: QuestSubmissionWithRelations) => {
    setProcessing(submission.id)

    const supabase = createClient()
    await supabase
      .from('quest_submissions')
      .update({
        status: 'rejected',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submission.id)

    setProcessing(null)
    router.refresh()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-0.5 bg-green-500/20 rounded-full text-xs font-medium text-green-300">承認済み</span>
      case 'rejected':
        return <span className="px-2 py-0.5 bg-red-500/20 rounded-full text-xs font-medium text-red-300">却下</span>
      default:
        return <span className="px-2 py-0.5 bg-amber-500/20 rounded-full text-xs font-medium text-amber-300">審査待ち</span>
    }
  }

  const questTypes = [
    { value: 'photo', label: '写真投稿', description: '写真をアップロードして完了' },
    { value: 'checkin', label: 'チェックイン', description: '場所にチェックインして完了' },
    { value: 'action', label: 'アクション', description: '特定のアクションを実行して完了' },
  ]

  const activeQuests = quests.filter(q => q.is_active)
  const inactiveQuests = quests.filter(q => !q.is_active)

  return (
    <div className="space-y-4">
      {/* 画像プレビューモーダル */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedImage}
              alt="プレビュー"
              className="max-w-full max-h-[90vh] object-contain rounded-xl"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* クエスト管理 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h2 className="font-semibold text-white text-lg">クエスト管理</h2>
            <p className="text-xs text-zinc-400 mt-1">有効: {activeQuests.length}件 / 無効: {inactiveQuests.length}件</p>
          </div>
          <Button size="sm" onClick={() => setShowQuestForm(!showQuestForm)}>
            {showQuestForm ? 'キャンセル' : '新規作成'}
          </Button>
        </CardHeader>
        <CardContent>
          {/* クエスト作成フォーム */}
          {showQuestForm && (
            <div className="mb-6 p-4 bg-white/5 rounded-xl border border-zinc-500/20">
              <h3 className="font-medium text-white mb-4">新しいクエストを作成</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">タイトル *</label>
                  <input
                    value={questFormData.title}
                    onChange={(e) => setQuestFormData({ ...questFormData, title: e.target.value })}
                    placeholder="例: MASUの商品を投稿しよう"
                    className="w-full px-3 py-3 border border-zinc-500/30 rounded-xl text-sm bg-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">説明 *</label>
                  <textarea
                    value={questFormData.description}
                    onChange={(e) => setQuestFormData({ ...questFormData, description: e.target.value })}
                    placeholder="クエストの詳細な説明..."
                    rows={2}
                    className="w-full px-3 py-3 border border-zinc-500/30 rounded-xl text-sm bg-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">クエストタイプ</label>
                  <select
                    value={questFormData.quest_type}
                    onChange={(e) => setQuestFormData({ ...questFormData, quest_type: e.target.value as QuestType })}
                    className="w-full px-3 py-3 border border-zinc-500/30 rounded-xl text-sm bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
                  >
                    {questTypes.map((type) => (
                      <option key={type.value} value={type.value} className="bg-zinc-900">
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">報酬ポイント</label>
                  <input
                    type="number"
                    value={questFormData.points_reward}
                    onChange={(e) => setQuestFormData({ ...questFormData, points_reward: parseInt(e.target.value) || 0 })}
                    min="1"
                    className="w-full px-3 py-3 border border-zinc-500/30 rounded-xl text-sm bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={questFormData.is_repeatable}
                      onChange={(e) => setQuestFormData({ ...questFormData, is_repeatable: e.target.checked })}
                      className="w-5 h-5 rounded border-zinc-500/30 bg-white/10 text-[#c0c0c0] focus:ring-[#c0c0c0]"
                    />
                    <div>
                      <span className="text-sm text-white">繰り返し可能</span>
                      <p className="text-xs text-zinc-500">ユーザーが複数回達成できるようにする</p>
                    </div>
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <Button
                    onClick={handleCreateQuest}
                    loading={creatingQuest}
                    disabled={!questFormData.title || !questFormData.description}
                  >
                    クエストを作成
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 有効なクエスト一覧 */}
          {activeQuests.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs text-zinc-400 font-medium mb-2">有効なクエスト</p>
              {activeQuests.map((quest) => (
                <div key={quest.id} className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{quest.title}</span>
                      <span className="px-2 py-0.5 bg-[#c0c0c0]/20 text-[#c0c0c0] rounded-full text-xs font-bold">
                        +{quest.points_reward}pt
                      </span>
                      {quest.is_repeatable && (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                          繰り返し可
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 truncate">{quest.description}</p>
                  </div>
                  <button
                    onClick={() => handleToggleQuest(quest.id, quest.is_active)}
                    disabled={togglingQuest === quest.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      togglingQuest === quest.id
                        ? 'bg-zinc-700 text-zinc-400'
                        : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                    }`}
                  >
                    {togglingQuest === quest.id ? '...' : '無効化'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 無効なクエスト一覧 */}
          {inactiveQuests.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 font-medium mb-2">無効なクエスト</p>
              {inactiveQuests.map((quest) => (
                <div key={quest.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 opacity-60">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-400">{quest.title}</span>
                      <span className="px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded-full text-xs">
                        +{quest.points_reward}pt
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 truncate">{quest.description}</p>
                  </div>
                  <button
                    onClick={() => handleToggleQuest(quest.id, quest.is_active)}
                    disabled={togglingQuest === quest.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      togglingQuest === quest.id
                        ? 'bg-zinc-700 text-zinc-400'
                        : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                    }`}
                  >
                    {togglingQuest === quest.id ? '...' : '有効化'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {quests.length === 0 && !showQuestForm && (
            <div className="text-center py-8">
              <p className="text-zinc-500">クエストがまだありません</p>
              <button
                onClick={() => setShowQuestForm(true)}
                className="mt-2 text-[#c0c0c0] hover:text-white text-sm"
              >
                最初のクエストを作成する →
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 承認待ち */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-white text-lg">承認待ちの投稿</h2>
            {pendingSubmissions.length > 0 && (
              <span className="px-2.5 py-1 bg-amber-500 rounded-full text-xs font-bold text-amber-900">
                {pendingSubmissions.length}件
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {pendingSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-zinc-500">承認待ちの投稿はありません</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingSubmissions.map((submission) => (
                <div key={submission.id} className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <div className="flex gap-4">
                    {/* 画像サムネイル */}
                    {submission.image_url && (
                      <div
                        className="w-28 h-28 rounded-xl overflow-hidden cursor-pointer flex-shrink-0 ring-2 ring-amber-500/30"
                        onClick={() => setSelectedImage(submission.image_url)}
                      >
                        <img
                          src={submission.image_url}
                          alt="投稿画像"
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    )}

                    {/* 詳細 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-white text-lg">
                          {submission.profiles?.display_name || '不明'}
                        </span>
                        <span className="text-zinc-500 text-xs font-mono">
                          {submission.profiles?.membership_id}
                        </span>
                      </div>
                      <p className="text-[#c0c0c0] font-medium mb-1">
                        {submission.guild_quests?.title}
                      </p>
                      {submission.comment && (
                        <p className="text-sm text-zinc-400 mb-2 bg-white/5 p-2 rounded-lg">{submission.comment}</p>
                      )}
                      <p className="text-xs text-zinc-500">{formatDate(submission.created_at)}</p>
                    </div>
                  </div>

                  {/* アクションボタン */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-amber-500/20">
                    <Button
                      onClick={() => handleApprove(submission)}
                      loading={processing === submission.id}
                      disabled={processing !== null}
                      className="flex-1"
                    >
                      承認 (+{submission.guild_quests?.points_reward}pt)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleReject(submission)}
                      loading={processing === submission.id}
                      disabled={processing !== null}
                      className="flex-1"
                    >
                      却下
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 審査済み */}
      {reviewedSubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-white">審査済み ({reviewedSubmissions.length}件)</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reviewedSubmissions.map((submission) => (
                <div key={submission.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  {submission.image_url && (
                    <div
                      className="w-10 h-10 rounded-lg overflow-hidden cursor-pointer flex-shrink-0"
                      onClick={() => setSelectedImage(submission.image_url)}
                    >
                      <img src={submission.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white truncate">
                        {submission.profiles?.display_name || '不明'}
                      </span>
                      {getStatusBadge(submission.status)}
                    </div>
                    <p className="text-xs text-zinc-500 truncate">
                      {submission.guild_quests?.title}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-600 flex-shrink-0">
                    {formatDate(submission.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ExchangeAdminTab({ items: initialItems, orders: initialOrders, adminId }: { items: ExchangeItem[]; orders: ExchangeOrderWithRelations[]; adminId: string }) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [orders, setOrders] = useState(initialOrders)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingItem, setEditingItem] = useState<ExchangeItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formNameEn, setFormNameEn] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formDescEn, setFormDescEn] = useState('')
  const [formCost, setFormCost] = useState('')
  const [formStock, setFormStock] = useState('-1')
  const [formCoupon, setFormCoupon] = useState('')

  const resetForm = () => {
    setFormName('')
    setFormNameEn('')
    setFormDesc('')
    setFormDescEn('')
    setFormCost('')
    setFormStock('-1')
    setFormCoupon('')
    setEditingItem(null)
    setShowCreateForm(false)
  }

  const startEdit = (item: ExchangeItem) => {
    setFormName(item.name)
    setFormNameEn(item.name_en || '')
    setFormDesc(item.description || '')
    setFormDescEn(item.description_en || '')
    setFormCost(String(item.points_cost))
    setFormStock(String(item.stock))
    setFormCoupon(item.coupon_code || '')
    setEditingItem(item)
    setShowCreateForm(true)
  }

  const handleSaveItem = async () => {
    if (!formName || !formCost) return
    setSaving(true)
    try {
      if (editingItem) {
        const res = await fetch('/api/admin/exchange-items', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingItem.id,
            name: formName,
            name_en: formNameEn || null,
            description: formDesc || null,
            description_en: formDescEn || null,
            points_cost: parseInt(formCost),
            stock: parseInt(formStock),
            coupon_code: formCoupon || null,
          }),
        })
        if (res.ok) {
          const { item } = await res.json()
          setItems(prev => prev.map(i => i.id === item.id ? item : i))
          resetForm()
        }
      } else {
        const res = await fetch('/api/admin/exchange-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            name_en: formNameEn || null,
            description: formDesc || null,
            description_en: formDescEn || null,
            points_cost: parseInt(formCost),
            stock: parseInt(formStock),
            coupon_code: formCoupon || null,
          }),
        })
        if (res.ok) {
          const { item } = await res.json()
          setItems(prev => [item, ...prev])
          resetForm()
        }
      }
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (item: ExchangeItem) => {
    const res = await fetch('/api/admin/exchange-items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, is_active: !item.is_active }),
    })
    if (res.ok) {
      const { item: updated } = await res.json()
      setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
    }
  }

  const handleOrderAction = async (orderId: string, status: 'approved' | 'rejected') => {
    setProcessing(orderId)
    try {
      const res = await fetch('/api/admin/exchange-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status }),
      })
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, reviewed_by: adminId, reviewed_at: new Date().toISOString() } : o))
      }
    } finally {
      setProcessing(null)
    }
  }

  const pendingOrders = orders.filter(o => o.status === 'pending')
  const processedOrders = orders.filter(o => o.status !== 'pending')

  return (
    <div className="space-y-6">
      {/* アイテム管理 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">交換アイテム</h2>
            <Button
              onClick={() => { resetForm(); setShowCreateForm(!showCreateForm) }}
              className="text-xs"
            >
              {showCreateForm ? 'キャンセル' : '+ 新規作成'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showCreateForm && (
            <div className="mb-4 p-4 bg-white/5 rounded-lg border border-zinc-700 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="アイテム名 *" value={formName} onChange={e => setFormName(e.target.value)} />
                <Input placeholder="Item Name (EN)" value={formNameEn} onChange={e => setFormNameEn(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="説明" value={formDesc} onChange={e => setFormDesc(e.target.value)} />
                <Input placeholder="Description (EN)" value={formDescEn} onChange={e => setFormDescEn(e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input placeholder="必要ポイント *" type="number" value={formCost} onChange={e => setFormCost(e.target.value)} />
                <Input placeholder="在庫 (-1=無制限)" type="number" value={formStock} onChange={e => setFormStock(e.target.value)} />
                <Input placeholder="クーポンコード" value={formCoupon} onChange={e => setFormCoupon(e.target.value)} />
              </div>
              <Button onClick={handleSaveItem} disabled={saving || !formName || !formCost}>
                {saving ? '保存中...' : editingItem ? '更新' : '作成'}
              </Button>
            </div>
          )}

          {items.length === 0 ? (
            <p className="text-zinc-500 text-sm">アイテムがありません</p>
          ) : (
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border ${item.is_active ? 'bg-white/5 border-zinc-700' : 'bg-zinc-900/50 border-zinc-800 opacity-60'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-medium">{item.name}</p>
                      {!item.is_active && <span className="text-xs text-red-400">無効</span>}
                    </div>
                    <p className="text-zinc-500 text-xs">{item.points_cost}pt / 在庫: {item.stock < 0 ? '無制限' : item.stock}{item.coupon_code ? ` / コード: ${item.coupon_code}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => startEdit(item)} className="text-xs text-blue-400 hover:text-blue-300">編集</button>
                    <button onClick={() => toggleActive(item)} className={`text-xs ${item.is_active ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}>
                      {item.is_active ? '無効化' : '有効化'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 承認待ち注文 */}
      {pendingOrders.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-white">承認待ち注文 ({pendingOrders.length})</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div>
                    <p className="text-white text-sm font-medium">{order.exchange_items?.name || '—'}</p>
                    <p className="text-zinc-400 text-xs">
                      {order.profiles?.display_name || order.profiles?.membership_id || '—'} / -{order.points_spent}pt / {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOrderAction(order.id, 'approved')}
                      disabled={processing === order.id}
                      className="px-3 py-1 rounded text-xs font-medium bg-green-500/20 text-green-300 hover:bg-green-500/30"
                    >
                      承認
                    </button>
                    <button
                      onClick={() => handleOrderAction(order.id, 'rejected')}
                      disabled={processing === order.id}
                      className="px-3 py-1 rounded text-xs font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30"
                    >
                      却下
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 処理済み注文 */}
      {processedOrders.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-white">処理済み注文</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {processedOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-zinc-700/50">
                  <div>
                    <p className="text-white text-sm">{order.exchange_items?.name || '—'}</p>
                    <p className="text-zinc-500 text-xs">
                      {order.profiles?.display_name || '—'} / -{order.points_spent}pt / {formatDate(order.created_at)}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    order.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                    order.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                    'bg-zinc-500/20 text-zinc-300'
                  }`}>
                    {order.status === 'approved' ? '承認' : order.status === 'rejected' ? '却下' : 'キャンセル'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function NotificationsTab() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('')
  const [sendEmail, setSendEmail] = useState(false)
  const [sending, setSending] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [result, setResult] = useState<{ sent: number; failed: number; emailSent: number; emailFailed: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    setShowConfirm(false)
    setSending(true)
    setResult(null)
    setError(null)

    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, url: url || undefined, sendEmail }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || '送信に失敗しました')
        return
      }

      const data = await res.json()
      setResult(data)
      setTitle('')
      setBody('')
      setUrl('')
      setSendEmail(false)
    } catch {
      setError('送信中にエラーが発生しました')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-bold text-white">プッシュ通知を送信</h3>
          <p className="text-sm text-zinc-400">全メンバーにブラウザプッシュ通知を送信します</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">タイトル</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="お知らせのタイトル"
                maxLength={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">本文</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="お知らせの内容を入力..."
                maxLength={500}
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]/50 focus:border-transparent resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">リンクURL（任意）</label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="/app/offers など"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#c0c0c0] focus:ring-[#c0c0c0]/50"
              />
              <span className="text-sm text-zinc-300">メールでも送信する</span>
            </label>

            <Button
              onClick={() => setShowConfirm(true)}
              disabled={!title.trim() || !body.trim() || sending}
              className="w-full"
            >
              {sending ? '送信中...' : '通知を送信'}
            </Button>

            {result && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <p className="text-green-400 text-sm font-medium">
                  送信完了 — プッシュ: {result.sent}件成功{result.failed > 0 && `、${result.failed}件失敗`}
                  {(result.emailSent > 0 || result.emailFailed > 0) && (
                    <> / メール: {result.emailSent}件成功{result.emailFailed > 0 && `、${result.emailFailed}件失敗`}</>
                  )}
                </p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 確認ダイアログ */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-800 rounded-2xl p-6 max-w-md w-full border border-white/10">
            <h4 className="text-lg font-bold text-white mb-2">通知を送信しますか？</h4>
            <p className="text-sm text-zinc-400 mb-4">
              全メンバーに以下の通知が送信されます。
            </p>
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <p className="text-white font-medium">{title}</p>
              <p className="text-zinc-400 text-sm mt-1">{body}</p>
              {url && <p className="text-zinc-500 text-xs mt-2">リンク: {url}</p>}
              {sendEmail && <p className="text-zinc-500 text-xs mt-2">+ メール送信あり</p>}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowConfirm(false)}
                variant="secondary"
                className="flex-1"
              >
                キャンセル
              </Button>
              <Button
                onClick={handleSend}
                className="flex-1"
              >
                送信する
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
