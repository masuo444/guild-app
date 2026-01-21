'use client'

import { useState } from 'react'
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

interface AdminDashboardProps {
  invites: (Invite & { profiles: { display_name: string } | null })[]
  members: Profile[]
  hubs: MasuHub[]
  questSubmissions: QuestSubmissionWithRelations[]
  quests: GuildQuest[]
  adminId: string
  adminEmail: string
}

type Tab = 'invites' | 'members' | 'hubs' | 'offers' | 'quests'

export function AdminDashboard({ invites, members, hubs, questSubmissions, quests, adminId, adminEmail }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('invites')

  // 承認待ちの投稿数
  const pendingCount = questSubmissions.filter(s => s.status === 'pending').length

  return (
    <div>
      {/* タブ */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {(['invites', 'members', 'hubs', 'offers', 'quests'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === tab
                ? 'bg-[#c0c0c0] text-zinc-900'
                : 'bg-white/10 text-zinc-300 hover:bg-white/20'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'quests' && pendingCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded text-xs ${
                activeTab === tab ? 'bg-zinc-900/20' : 'bg-amber-500/30 text-amber-300'
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

    await supabase.from('invites').insert({
      code,
      invited_by: adminId,
      used: false,
      membership_type: selectedType,
    })

    router.refresh()
    setCreating(false)
  }

  const copyToClipboard = (code: string) => {
    const url = `${window.location.origin}/invite/${code}`
    navigator.clipboard.writeText(url)
  }

  const unusedCount = invites.filter((i) => !i.used).length

  // メンバータイプに応じた背景色を取得
  const getTypeBgColor = (type: MembershipType) => {
    switch (type) {
      case 'model':
        return 'bg-pink-500/20 text-pink-300'
      case 'ambassador':
        return 'bg-purple-500/20 text-purple-300'
      case 'staff':
        return 'bg-blue-500/20 text-blue-300'
      case 'partner':
        return 'bg-amber-500/20 text-amber-300'
      default:
        return 'bg-zinc-500/20 text-zinc-400'
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-row items-center justify-between">
          <div>
            <h2 className="font-semibold text-white">Invite Codes</h2>
            <p className="text-sm text-zinc-300">
              {unusedCount} unused / {invites.length} total
            </p>
          </div>
        </div>
        {/* 招待コード生成フォーム */}
        <div className="flex flex-row items-end gap-3 p-4 bg-white/5 rounded-lg">
          <div className="flex-1">
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Member Type
            </label>
            <select
              className="w-full px-3 py-2 border border-zinc-500/30 rounded-lg text-sm bg-white/10 text-white"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as MembershipType)}
            >
              {availableMembershipTypes.map((type) => (
                <option key={type} value={type} className="bg-zinc-900">
                  {MEMBERSHIP_TYPE_LABELS[type]} {isFreeMembershipType(type) ? '(Free)' : '(Paid)'}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={handleCreateInvite} loading={creating} size="sm">
            Generate Code
          </Button>
        </div>
        {!canCreateFreeInvite && (
          <p className="text-xs text-zinc-400 mt-2">
            Note: Only the super admin can issue free invitation codes.
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                invite.used ? 'bg-white/5' : 'bg-green-500/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-medium text-white">{invite.code}</p>
                    {invite.membership_type && invite.membership_type !== 'standard' && (
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getTypeBgColor(invite.membership_type)}`}>
                        {MEMBERSHIP_TYPE_LABELS[invite.membership_type]}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-300">
                    {invite.used
                      ? `Used by ${invite.profiles?.display_name || 'Unknown'}`
                      : isFreeMembershipType(invite.membership_type) ? 'Free Invitation' : 'Available'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-300/50">{formatDate(invite.created_at)}</span>
                {!invite.used && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(invite.code)}
                  >
                    Copy Link
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function MembersTab({ members }: { members: Profile[] }) {
  const router = useRouter()
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null)
  const [points, setPoints] = useState('')
  const [note, setNote] = useState('')
  const [adding, setAdding] = useState(false)
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)

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

  return (
    <div className="space-y-4">
      {/* ポイント付与フォーム */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-white">Award Points</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              className="px-3 py-2 border border-zinc-500/30 rounded-lg text-sm bg-white/10 text-white"
              value={selectedMember?.id || ''}
              onChange={(e) => {
                const member = members.find((m) => m.id === e.target.value)
                setSelectedMember(member || null)
              }}
            >
              <option value="" className="bg-zinc-900">Select member...</option>
              {members.map((member) => (
                <option key={member.id} value={member.id} className="bg-zinc-900">
                  {member.display_name || member.membership_id || 'Unknown'}
                </option>
              ))}
            </select>
            <Input
              type="number"
              placeholder="Points"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
            />
            <Input
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button
              onClick={handleAddPoints}
              loading={adding}
              disabled={!selectedMember || !points}
            >
              Add Points
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* メンバー一覧 */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-white">All Members ({members.length})</h2>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-500/30">
                  <th className="text-left py-2 font-medium text-zinc-300">Name</th>
                  <th className="text-left py-2 font-medium text-zinc-300">Membership ID</th>
                  <th className="text-left py-2 font-medium text-zinc-300">Type</th>
                  <th className="text-left py-2 font-medium text-zinc-300">Role</th>
                  <th className="text-left py-2 font-medium text-zinc-300">Status</th>
                  <th className="text-left py-2 font-medium text-zinc-300">Location</th>
                  <th className="text-left py-2 font-medium text-zinc-300">Joined</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const memberType = member.membership_type || 'standard'
                  const typeColors: Record<MembershipType, string> = {
                    standard: 'bg-zinc-500/20 text-zinc-400',
                    model: 'bg-pink-500/20 text-pink-300',
                    ambassador: 'bg-purple-500/20 text-purple-300',
                    staff: 'bg-blue-500/20 text-blue-300',
                    partner: 'bg-amber-500/20 text-amber-300',
                  }
                  return (
                    <tr key={member.id} className="border-b border-zinc-500/20">
                      <td className="py-2">
                        <span className="font-medium text-white">
                          {member.display_name || '-'}
                        </span>
                      </td>
                      <td className="py-2 font-mono text-zinc-300">{member.membership_id || '-'}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[memberType]}`}>
                          {MEMBERSHIP_TYPE_LABELS[memberType]}
                        </span>
                      </td>
                      <td className="py-2">
                        <select
                          value={member.role || 'member'}
                          onChange={(e) => handleRoleChange(member.id, e.target.value as 'member' | 'admin')}
                          disabled={updatingRole === member.id}
                          className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${
                            member.role === 'admin'
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-zinc-500/20 text-zinc-300'
                          } ${updatingRole === member.id ? 'opacity-50' : ''}`}
                        >
                          <option value="member" className="bg-zinc-900">Member</option>
                          <option value="admin" className="bg-zinc-900">Admin</option>
                        </select>
                      </td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            member.subscription_status === 'active' || member.subscription_status === 'free'
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {member.subscription_status === 'free' ? 'Free' : member.subscription_status}
                        </span>
                      </td>
                      <td className="py-2 text-zinc-300">
                        {member.home_city && member.home_country
                          ? `${member.home_city}, ${member.home_country}`
                          : '-'}
                      </td>
                      <td className="py-2 text-zinc-300/50">{formatDate(member.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function HubsTab({ hubs }: { hubs: MasuHub[] }) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    country: '',
    city: '',
  })

  const handleCreate = async () => {
    if (!formData.name || !formData.country || !formData.city) return
    setCreating(true)

    // Geocoding
    let lat = 0
    let lng = 0

    try {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        `${formData.city}, ${formData.country}`
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="font-semibold text-white">MASU Hubs ({hubs.length})</h2>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add Hub'}
          </Button>
        </CardHeader>
        <CardContent>
          {showForm && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-white/5 rounded-lg">
              <Input
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Hub name"
              />
              <Input
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
              <Input
                label="Country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="e.g., Japan"
              />
              <Input
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g., Tokyo"
              />
              <div className="md:col-span-2">
                <Button onClick={handleCreate} loading={creating}>
                  Create Hub
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {hubs.map((hub) => (
              <div
                key={hub.id}
                className={`p-3 rounded-lg ${hub.is_active ? 'bg-zinc-500/10' : 'bg-white/5'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-white">{hub.name}</p>
                    <p className="text-sm text-zinc-300">
                      {hub.city}, {hub.country}
                    </p>
                    {hub.description && (
                      <p className="text-xs text-zinc-300/50 mt-1">{hub.description}</p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      hub.is_active ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-zinc-300'
                    }`}
                  >
                    {hub.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
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

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold text-white">Create Offer</h2>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Offer title"
          />
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Type</label>
            <select
              className="w-full px-3 py-2 border border-zinc-500/30 rounded-lg text-sm bg-white/10 text-white"
              value={formData.offer_type}
              onChange={(e) => setFormData({ ...formData, offer_type: e.target.value })}
            >
              <option value="Discount" className="bg-zinc-900">Discount</option>
              <option value="Access" className="bg-zinc-900">Access</option>
              <option value="Service" className="bg-zinc-900">Service</option>
              <option value="Product" className="bg-zinc-900">Product</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-zinc-300 mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-zinc-500/30 rounded-lg text-sm bg-white/10 text-white placeholder-zinc-300/50"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the offer..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Minimum Rank Required
            </label>
            <select
              className="w-full px-3 py-2 border border-zinc-500/30 rounded-lg text-sm bg-white/10 text-white"
              value={formData.min_rank}
              onChange={(e) =>
                setFormData({ ...formData, min_rank: e.target.value as Rank })
              }
            >
              <option value="D" className="bg-zinc-900">D (All members)</option>
              <option value="C" className="bg-zinc-900">C (100+ points)</option>
              <option value="B" className="bg-zinc-900">B (300+ points)</option>
              <option value="A" className="bg-zinc-900">A (800+ points)</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleCreate} loading={creating}>
              Create Offer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function QuestsTab({ submissions, quests, adminId }: { submissions: QuestSubmissionWithRelations[]; quests: GuildQuest[]; adminId: string }) {
  const router = useRouter()
  const [processing, setProcessing] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // 承認待ち/それ以外で分ける
  const pendingSubmissions = submissions.filter(s => s.status === 'pending')
  const reviewedSubmissions = submissions.filter(s => s.status !== 'pending')

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
        return <span className="px-2 py-0.5 bg-green-500/20 rounded text-xs font-medium text-green-300">Approved</span>
      case 'rejected':
        return <span className="px-2 py-0.5 bg-red-500/20 rounded text-xs font-medium text-red-300">Rejected</span>
      default:
        return <span className="px-2 py-0.5 bg-amber-500/20 rounded text-xs font-medium text-amber-300">Pending</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* 画像プレビューモーダル */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}

      {/* 承認待ち */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-white">Pending Submissions</h2>
            {pendingSubmissions.length > 0 && (
              <span className="px-2 py-0.5 bg-amber-500/20 rounded text-xs font-medium text-amber-300">
                {pendingSubmissions.length}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {pendingSubmissions.length === 0 ? (
            <p className="text-zinc-400 text-center py-8">No pending submissions</p>
          ) : (
            <div className="space-y-4">
              {pendingSubmissions.map((submission) => (
                <div key={submission.id} className="flex gap-4 p-4 bg-white/5 rounded-lg">
                  {/* 画像サムネイル */}
                  {submission.image_url && (
                    <div
                      className="w-24 h-24 rounded-lg overflow-hidden cursor-pointer flex-shrink-0"
                      onClick={() => setSelectedImage(submission.image_url)}
                    >
                      <img
                        src={submission.image_url}
                        alt="Submission"
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  )}

                  {/* 詳細 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">
                        {submission.profiles?.display_name || 'Unknown'}
                      </span>
                      <span className="text-zinc-500 text-xs">
                        {submission.profiles?.membership_id}
                      </span>
                    </div>
                    <p className="text-sm text-[#c0c0c0] mb-1">
                      {submission.guild_quests?.title}
                    </p>
                    {submission.comment && (
                      <p className="text-sm text-zinc-400 mb-2">{submission.comment}</p>
                    )}
                    <p className="text-xs text-zinc-500">{formatDate(submission.created_at)}</p>
                  </div>

                  {/* アクション */}
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(submission)}
                      loading={processing === submission.id}
                      disabled={processing !== null}
                    >
                      Approve (+{submission.guild_quests?.points_reward}pt)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(submission)}
                      loading={processing === submission.id}
                      disabled={processing !== null}
                    >
                      Reject
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
            <h2 className="font-semibold text-white">Reviewed Submissions</h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-500/30">
                    <th className="text-left py-2 font-medium text-zinc-300">User</th>
                    <th className="text-left py-2 font-medium text-zinc-300">Quest</th>
                    <th className="text-left py-2 font-medium text-zinc-300">Status</th>
                    <th className="text-left py-2 font-medium text-zinc-300">Date</th>
                    <th className="text-left py-2 font-medium text-zinc-300">Image</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewedSubmissions.map((submission) => (
                    <tr key={submission.id} className="border-b border-zinc-500/20">
                      <td className="py-2 text-white">
                        {submission.profiles?.display_name || 'Unknown'}
                      </td>
                      <td className="py-2 text-zinc-300">
                        {submission.guild_quests?.title}
                      </td>
                      <td className="py-2">
                        {getStatusBadge(submission.status)}
                      </td>
                      <td className="py-2 text-zinc-400">
                        {formatDate(submission.created_at)}
                      </td>
                      <td className="py-2">
                        {submission.image_url && (
                          <button
                            onClick={() => setSelectedImage(submission.image_url)}
                            className="text-blue-400 hover:text-blue-300 text-xs"
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
