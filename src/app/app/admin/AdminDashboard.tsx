'use client'

import { useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Invite, Profile, MasuHub, Rank, MembershipType, MEMBERSHIP_TYPE_LABELS, isFreeMembershipType, FREE_MEMBERSHIP_TYPES, GuildQuest, QuestSubmission } from '@/types/database'
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

// 招待者情報付きのInvite
interface InviteWithRelations extends Invite {
  profiles: { display_name: string } | null
}

interface AdminDashboardProps {
  invites: InviteWithRelations[]
  members: Profile[]
  hubs: MasuHub[]
  questSubmissions: QuestSubmissionWithRelations[]
  quests: GuildQuest[]
  adminId: string
  adminEmail: string
}

type Tab = 'invites' | 'members' | 'hubs' | 'offers' | 'quests'

const TAB_LABELS: Record<Tab, string> = {
  invites: '招待コード',
  members: 'メンバー',
  hubs: '拠点',
  offers: 'オファー',
  quests: 'クエスト',
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
  hubs: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  offers: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  ),
  quests: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
}

export function AdminDashboard({ invites, members, hubs, questSubmissions, quests, adminId, adminEmail }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('invites')

  // 承認待ちの投稿数
  const pendingCount = questSubmissions.filter(s => s.status === 'pending').length
  const unusedInviteCount = invites.filter(i => !i.used).length

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
        {(['invites', 'members', 'hubs', 'offers', 'quests'] as Tab[]).map((tab) => (
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
      {activeTab === 'members' && <MembersTab members={members} />}
      {activeTab === 'hubs' && <HubsTab hubs={hubs} />}
      {activeTab === 'offers' && <OffersTab />}
      {activeTab === 'quests' && <QuestsTab submissions={questSubmissions} quests={quests} adminId={adminId} />}
    </div>
  )
}

function InvitesTab({ invites, adminId, adminEmail }: { invites: AdminDashboardProps['invites']; adminId: string; adminEmail: string }) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [selectedType, setSelectedType] = useState<MembershipType>('standard')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // 無料招待を発行できるか
  const canCreateFreeInvite = canIssueFreeInvite(adminEmail)

  // 利用可能なメンバータイプ
  const availableMembershipTypes: MembershipType[] = canCreateFreeInvite
    ? ['standard', ...FREE_MEMBERSHIP_TYPES]
    : ['standard']

  const handleCreateInvite = async () => {
    setCreating(true)
    const supabase = createClient()
    const code = generateInviteCode()

    const { error } = await supabase.from('invites').insert({
      code,
      invited_by: adminId,
      used: false,
      membership_type: selectedType,
    })

    if (error) {
      console.error('招待コード作成エラー:', error)
      alert(`エラー: ${error.message}`)
    } else {
      alert(`招待コード ${code} を作成しました`)
    }

    router.refresh()
    setCreating(false)
  }

  const copyToClipboard = (code: string) => {
    const url = `${window.location.origin}/invite/${code}`
    navigator.clipboard.writeText(url)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const unusedInvites = invites.filter((i) => !i.used)
  const usedInvites = invites.filter((i) => i.used)

  // メンバータイプに応じた背景色を取得
  const getTypeBgColor = (type: MembershipType) => {
    switch (type) {
      case 'model': return 'bg-pink-500/20 text-pink-300 border-pink-500/30'
      case 'ambassador': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'staff': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
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
          {!canCreateFreeInvite && (
            <p className="text-xs text-zinc-500 mt-3">
              ※ 無料招待コードはスーパー管理者のみ発行可能です
            </p>
          )}
        </CardContent>
      </Card>

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

      {/* 使用済みの招待コード */}
      {usedInvites.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-white">使用済み ({usedInvites.length})</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {usedInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                      <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-zinc-400">{invite.code}</p>
                        {invite.membership_type && invite.membership_type !== 'standard' && (
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium opacity-60 ${getTypeBgColor(invite.membership_type)}`}>
                            {MEMBERSHIP_TYPE_LABELS[invite.membership_type]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">
                        {invite.profiles?.display_name || '不明'} が使用
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500">{formatDate(invite.created_at)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MembersTab({ members }: { members: Profile[] }) {
  const router = useRouter()
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null)
  const [points, setPoints] = useState('')
  const [note, setNote] = useState('')
  const [adding, setAdding] = useState(false)
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleAddPoints = async () => {
    if (!selectedMember || !points) return
    setAdding(true)

    const supabase = createClient()
    await supabase.from('activity_logs').insert({
      user_id: selectedMember.id,
      type: 'Admin Award',
      points: parseInt(points),
      note: note || null,
    })

    setSelectedMember(null)
    setPoints('')
    setNote('')
    router.refresh()
    setAdding(false)
  }

  const handleRoleChange = async (memberId: string, newRole: 'member' | 'admin') => {
    setUpdatingRole(memberId)
    const supabase = createClient()

    await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', memberId)

    router.refresh()
    setUpdatingRole(null)
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
    model: 'bg-pink-500/20 text-pink-300',
    ambassador: 'bg-purple-500/20 text-purple-300',
    staff: 'bg-blue-500/20 text-blue-300',
    partner: 'bg-amber-500/20 text-amber-300',
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
          <div className="space-y-2">
            {filteredMembers.map((member) => {
              const memberType = member.membership_type || 'standard'
              return (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* アバター */}
                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-zinc-400 font-bold text-sm">
                          {(member.display_name || '?')[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white truncate">
                          {member.display_name || '名前未設定'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[memberType]}`}>
                          {MEMBERSHIP_TYPE_LABELS[memberType]}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          member.subscription_status === 'active' || member.subscription_status === 'free'
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {member.subscription_status === 'free' ? '無料' : member.subscription_status === 'active' ? '有効' : '無効'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5 flex-wrap">
                        <span className="font-mono">{member.membership_id || '-'}</span>
                        {member.home_city && member.home_country && (
                          <>
                            <span>•</span>
                            <span>{member.home_city}, {member.home_country}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <select
                      value={member.role || 'member'}
                      onChange={(e) => handleRoleChange(member.id, e.target.value as 'member' | 'admin')}
                      disabled={updatingRole === member.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#c0c0c0] ${
                        member.role === 'admin'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-zinc-700 text-zinc-300'
                      } ${updatingRole === member.id ? 'opacity-50' : ''}`}
                    >
                      <option value="member" className="bg-zinc-900">メンバー</option>
                      <option value="admin" className="bg-zinc-900">管理者</option>
                    </select>
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
    country: '',
    city: '',
  })

  // 編集モードを開始
  const startEdit = (hub: MasuHub) => {
    setEditingHub(hub)
    setFormData({
      name: hub.name,
      description: hub.description || '',
      country: hub.country,
      city: hub.city,
    })
    setShowForm(false)
  }

  // 編集をキャンセル
  const cancelEdit = () => {
    setEditingHub(null)
    setFormData({ name: '', description: '', country: '', city: '' })
  }

  // ジオコーディング処理
  const geocodeAddress = async (city: string, country: string) => {
    let lat = 0
    let lng = 0

    try {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        `${city}, ${country}`
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

    const { lat, lng } = await geocodeAddress(formData.city, formData.country)

    const supabase = createClient()
    await supabase.from('masu_hubs').insert({
      name: formData.name,
      description: formData.description || null,
      country: formData.country,
      city: formData.city,
      lat,
      lng,
      is_active: true,
    })

    setFormData({ name: '', description: '', country: '', city: '' })
    setShowForm(false)
    router.refresh()
    setCreating(false)
  }

  // 更新
  const handleUpdate = async () => {
    if (!editingHub || !formData.name || !formData.country || !formData.city) return
    setUpdating(true)

    // 都市か国が変わった場合のみ再ジオコーディング
    let lat = editingHub.lat
    let lng = editingHub.lng
    if (formData.city !== editingHub.city || formData.country !== editingHub.country) {
      const coords = await geocodeAddress(formData.city, formData.country)
      lat = coords.lat
      lng = coords.lng
    }

    const supabase = createClient()
    await supabase
      .from('masu_hubs')
      .update({
        name: formData.name,
        description: formData.description || null,
        country: formData.country,
        city: formData.city,
        lat,
        lng,
      })
      .eq('id', editingHub.id)

    setEditingHub(null)
    setFormData({ name: '', description: '', country: '', city: '' })
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
                  <p className="text-sm text-zinc-400">{hub.city}, {hub.country}</p>
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
                      <p className="text-xs text-zinc-500">{hub.city}, {hub.country}</p>
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
    { value: 'D', label: 'D (全メンバー)' },
    { value: 'C', label: 'C (100pt以上)' },
    { value: 'B', label: 'B (300pt以上)' },
    { value: 'A', label: 'A (800pt以上)' },
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

  // クエスト作成
  const handleCreateQuest = async () => {
    if (!questFormData.title || !questFormData.description) return
    setCreatingQuest(true)

    const supabase = createClient()
    await supabase.from('guild_quests').insert({
      title: questFormData.title,
      description: questFormData.description,
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
