'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Profile,
  MasuHub,
  Invite,
  GuildOffer,
  GuildQuest,
  QuestSubmission,
  QuestType,
  MembershipType,
  SubscriptionStatus,
  UserRole,
  MEMBERSHIP_TYPE_LABELS,
  CustomRole,
  MemberRole,
  RoleColor,
  ROLE_COLOR_OPTIONS,
} from '@/types/database'

// 拡張されたQuestSubmission型（リレーションデータ含む）
interface QuestSubmissionWithRelations extends QuestSubmission {
  guild_quests: { title: string; points_reward: number } | null
  profiles: { display_name: string | null; membership_id: string | null } | null
}
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { formatDate, generateInviteCode } from '@/lib/utils'

interface SuperAdminDashboardProps {
  members: Profile[]
  hubs: MasuHub[]
  invites: (Invite & { profiles: { display_name: string } | null })[]
  offers: (GuildOffer & { profiles: { display_name: string } | null })[]
  customRoles: CustomRole[]
  memberRoles: MemberRole[]
  quests: GuildQuest[]
  questSubmissions: QuestSubmissionWithRelations[]
  adminId: string
}

type Tab = 'members' | 'roles' | 'hubs' | 'invites' | 'offers' | 'quests' | 'questSubmissions'

export function SuperAdminDashboard({ members, hubs, invites, offers, customRoles, memberRoles, quests, questSubmissions, adminId }: SuperAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('members')

  // 承認待ちの投稿数
  const pendingCount = questSubmissions.filter(s => s.status === 'pending').length

  const tabs: { key: Tab; label: string; count?: number; highlight?: boolean }[] = [
    { key: 'members', label: 'Members', count: members.length },
    { key: 'roles', label: 'Roles', count: customRoles.length },
    { key: 'hubs', label: 'MASU Hubs', count: hubs.length },
    { key: 'invites', label: 'Invites', count: invites.length },
    { key: 'offers', label: 'Offers', count: offers.length },
    { key: 'quests', label: 'Quests', count: quests.length },
    { key: 'questSubmissions', label: 'Quest Submissions', count: pendingCount, highlight: pendingCount > 0 },
  ]

  return (
    <div>
      {/* タブ */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === tab.key
                ? 'bg-[#c0c0c0] text-zinc-900'
                : 'bg-white/10 text-zinc-300 hover:bg-white/20'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded text-xs ${
                activeTab === tab.key
                  ? 'bg-zinc-900/20'
                  : tab.highlight
                    ? 'bg-amber-500/30 text-amber-300'
                    : 'bg-white/20'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* コンテンツ */}
      {activeTab === 'members' && <MembersTab members={members} customRoles={customRoles} memberRoles={memberRoles} />}
      {activeTab === 'roles' && <RolesTab members={members} customRoles={customRoles} memberRoles={memberRoles} />}
      {activeTab === 'hubs' && <HubsTab hubs={hubs} />}
      {activeTab === 'invites' && <InvitesTab invites={invites} />}
      {activeTab === 'offers' && <OffersTab offers={offers} />}
      {activeTab === 'quests' && <QuestsManagementTab quests={quests} />}
      {activeTab === 'questSubmissions' && <QuestSubmissionsTab submissions={questSubmissions} adminId={adminId} />}
    </div>
  )
}

// メンバー管理タブ
function MembersTab({ members, customRoles, memberRoles }: { members: Profile[]; customRoles: CustomRole[]; memberRoles: MemberRole[] }) {
  const router = useRouter()
  const [editingMember, setEditingMember] = useState<Profile | null>(null)
  const [editingMemberRoles, setEditingMemberRoles] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredMembers = members.filter(m =>
    m.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.membership_id?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // メンバーのカスタムロールを取得
  const getMemberCustomRoles = (memberId: string) => {
    const roleIds = memberRoles.filter(mr => mr.member_id === memberId).map(mr => mr.role_id)
    return customRoles.filter(cr => roleIds.includes(cr.id))
  }

  // メンバーのロールIDを取得
  const getMemberRoleIds = (memberId: string) => {
    return memberRoles.filter(mr => mr.member_id === memberId).map(mr => mr.role_id)
  }

  // 編集モーダルを開く
  const openEditModal = (member: Profile) => {
    setEditingMember(member)
    setEditingMemberRoles(getMemberRoleIds(member.id))
  }

  // ロールのトグル
  const toggleRole = (roleId: string) => {
    setEditingMemberRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    )
  }

  const handleSaveMember = async () => {
    if (!editingMember) return
    setSaving(true)

    const supabase = createClient()

    // プロフィール更新
    await supabase
      .from('profiles')
      .update({
        display_name: editingMember.display_name,
        role: editingMember.role,
        membership_type: editingMember.membership_type,
        subscription_status: editingMember.subscription_status,
        membership_status: editingMember.membership_status,
        home_country: editingMember.home_country,
        home_city: editingMember.home_city,
        instagram_id: editingMember.instagram_id,
      })
      .eq('id', editingMember.id)

    // ロール更新: 既存のロールを削除して新しいロールを追加
    const currentRoleIds = getMemberRoleIds(editingMember.id)

    // 削除するロール
    const rolesToRemove = currentRoleIds.filter(id => !editingMemberRoles.includes(id))
    if (rolesToRemove.length > 0) {
      await supabase
        .from('member_roles')
        .delete()
        .eq('member_id', editingMember.id)
        .in('role_id', rolesToRemove)
    }

    // 追加するロール
    const rolesToAdd = editingMemberRoles.filter(id => !currentRoleIds.includes(id))
    if (rolesToAdd.length > 0) {
      await supabase
        .from('member_roles')
        .insert(rolesToAdd.map(roleId => ({
          member_id: editingMember.id,
          role_id: roleId,
        })))
    }

    setEditingMember(null)
    setEditingMemberRoles([])
    setSaving(false)
    router.refresh()
  }

  const getStatusColor = (status: SubscriptionStatus) => {
    switch (status) {
      case 'active':
      case 'free':
        return 'bg-green-500/20 text-green-300'
      case 'free_tier':
        return 'bg-blue-500/20 text-blue-300'
      default:
        return 'bg-red-500/20 text-red-300'
    }
  }

  const getRoleColorClass = (color: RoleColor) => {
    const option = ROLE_COLOR_OPTIONS.find(o => o.value === color)
    return option?.bg || 'bg-gray-500'
  }

  return (
    <div className="space-y-4">
      {/* 検索 */}
      <div className="flex gap-4">
        <Input
          placeholder="Search by name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* メンバー編集モーダル */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <h3 className="text-lg font-semibold text-white">Edit Member</h3>
              <p className="text-sm text-zinc-400">{editingMember.membership_id}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 基本情報 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Display Name"
                  value={editingMember.display_name || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, display_name: e.target.value })}
                />
                <Input
                  label="Instagram ID"
                  value={editingMember.instagram_id || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, instagram_id: e.target.value })}
                  placeholder="@なし"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Country"
                  value={editingMember.home_country || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, home_country: e.target.value })}
                  placeholder="Japan"
                />
                <Input
                  label="City"
                  value={editingMember.home_city || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, home_city: e.target.value })}
                  placeholder="Tokyo"
                />
              </div>

              {/* 権限設定 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">System Role</label>
                  <select
                    className="w-full px-3 py-2 border border-zinc-500/30 rounded-lg text-sm bg-white/10 text-white"
                    value={editingMember.role}
                    onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value as UserRole })}
                  >
                    <option value="member" className="bg-zinc-900">Member</option>
                    <option value="admin" className="bg-zinc-900">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Membership Type</label>
                  <select
                    className="w-full px-3 py-2 border border-zinc-500/30 rounded-lg text-sm bg-white/10 text-white"
                    value={editingMember.membership_type}
                    onChange={(e) => setEditingMember({ ...editingMember, membership_type: e.target.value as MembershipType })}
                  >
                    <option value="standard" className="bg-zinc-900">Standard</option>
                    <option value="ambassador" className="bg-zinc-900">Ambassador</option>
                    <option value="partner" className="bg-zinc-900">Partner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">Subscription Status</label>
                  <select
                    className="w-full px-3 py-2 border border-zinc-500/30 rounded-lg text-sm bg-white/10 text-white"
                    value={editingMember.subscription_status}
                    onChange={(e) => setEditingMember({ ...editingMember, subscription_status: e.target.value as SubscriptionStatus })}
                  >
                    <option value="active" className="bg-zinc-900">有料 (Active)</option>
                    <option value="free" className="bg-zinc-900">無料 (Free)</option>
                  </select>
                </div>
              </div>

              {/* カスタムロール */}
              {customRoles.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Custom Roles</label>
                  <div className="flex flex-wrap gap-2">
                    {customRoles.map((role) => {
                      const isSelected = editingMemberRoles.includes(role.id)
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => toggleRole(role.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            isSelected
                              ? `${getRoleColorClass(role.color)} text-white ring-2 ring-white/30`
                              : 'bg-white/10 text-zinc-400 hover:bg-white/20'
                          }`}
                        >
                          {role.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-zinc-500/30">
                <Button variant="outline" onClick={() => { setEditingMember(null); setEditingMemberRoles([]) }} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSaveMember} loading={saving} className="flex-1">
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* メンバー一覧 */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-500/30">
                  <th className="text-left py-3 px-4 font-medium text-zinc-300">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-300">ID</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-300">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-300">Tags</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-300">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-300">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-300">Joined</th>
                  <th className="text-right py-3 px-4 font-medium text-zinc-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => {
                  const memberCustomRoles = getMemberCustomRoles(member.id)
                  return (
                    <tr key={member.id} className="border-b border-zinc-500/20 hover:bg-white/5">
                      <td className="py-3 px-4">
                        <span className="font-medium text-white">{member.display_name || '-'}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-400 text-xs">{member.membership_id}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          member.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-zinc-500/20 text-zinc-300'
                        }`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1 flex-wrap">
                          {memberCustomRoles.map((cr) => (
                            <span
                              key={cr.id}
                              className={`px-2 py-0.5 rounded text-xs font-medium text-white ${getRoleColorClass(cr.color)}`}
                            >
                              {cr.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-500/20 text-zinc-300">
                          {MEMBERSHIP_TYPE_LABELS[member.membership_type]}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(member.subscription_status)}`}>
                          {member.subscription_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-400">{formatDate(member.created_at)}</td>
                      <td className="py-3 px-4 text-right">
                        <Button size="sm" variant="ghost" onClick={() => openEditModal(member)}>
                          Edit
                        </Button>
                      </td>
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

// ロール管理タブ（カスタムロール対応版）
function RolesTab({ members, customRoles, memberRoles }: { members: Profile[]; customRoles: CustomRole[]; memberRoles: MemberRole[] }) {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<CustomRole | null>(customRoles[0] || null)
  const [saving, setSaving] = useState<string | null>(null)
  const [showAddRoleForm, setShowAddRoleForm] = useState(false)
  const [newRole, setNewRole] = useState({ name: '', color: 'blue' as RoleColor, description: '' })
  const [creatingRole, setCreatingRole] = useState(false)

  // 選択されたロールを持つメンバー
  const roleMembers = selectedRole
    ? members.filter(m => memberRoles.some(mr => mr.member_id === m.id && mr.role_id === selectedRole.id))
    : []

  // 選択されたロールを持たないメンバー
  const nonRoleMembers = selectedRole
    ? members.filter(m => !memberRoles.some(mr => mr.member_id === m.id && mr.role_id === selectedRole.id))
    : members

  const handleAssignRole = async (memberId: string) => {
    if (!selectedRole) return
    setSaving(memberId)
    const supabase = createClient()
    await supabase.from('member_roles').insert({
      member_id: memberId,
      role_id: selectedRole.id,
    })
    setSaving(null)
    router.refresh()
  }

  const handleRemoveRole = async (memberId: string) => {
    if (!selectedRole) return
    setSaving(memberId)
    const supabase = createClient()
    await supabase
      .from('member_roles')
      .delete()
      .eq('member_id', memberId)
      .eq('role_id', selectedRole.id)
    setSaving(null)
    router.refresh()
  }

  const handleCreateRole = async () => {
    if (!newRole.name.trim()) return
    setCreatingRole(true)
    const supabase = createClient()
    await supabase.from('custom_roles').insert({
      name: newRole.name,
      color: newRole.color,
      description: newRole.description || null,
    })
    setNewRole({ name: '', color: 'blue', description: '' })
    setShowAddRoleForm(false)
    setCreatingRole(false)
    router.refresh()
  }

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('このロールを削除しますか？メンバーからも削除されます。')) return
    const supabase = createClient()
    // 関連する member_roles も削除
    await supabase.from('member_roles').delete().eq('role_id', roleId)
    await supabase.from('custom_roles').delete().eq('id', roleId)
    if (selectedRole?.id === roleId) {
      setSelectedRole(null)
    }
    router.refresh()
  }

  const getRoleColorClass = (color: RoleColor) => {
    const option = ROLE_COLOR_OPTIONS.find(o => o.value === color)
    return option?.bg || 'bg-gray-500'
  }

  return (
    <div className="space-y-6">
      {/* ロール追加フォーム */}
      {showAddRoleForm && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-white">新しいロールを作成</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="ロール名"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                placeholder="例: VIP, Staff, Model..."
              />
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">カラー</label>
                <select
                  className="w-full px-3 py-2 border border-zinc-500/30 rounded-lg text-sm bg-white/10 text-white"
                  value={newRole.color}
                  onChange={(e) => setNewRole({ ...newRole, color: e.target.value as RoleColor })}
                >
                  {ROLE_COLOR_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-zinc-900">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="説明（任意）"
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                placeholder="ロールの説明"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowAddRoleForm(false)}>キャンセル</Button>
              <Button onClick={handleCreateRole} loading={creatingRole}>作成</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ロール一覧 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="font-semibold text-white">カスタムロール</h3>
            <Button size="sm" onClick={() => setShowAddRoleForm(true)}>+ 追加</Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {customRoles.length === 0 ? (
              <p className="text-zinc-400 text-sm py-4 text-center">ロールがありません</p>
            ) : (
              customRoles.map((role) => {
                const memberCount = memberRoles.filter(mr => mr.role_id === role.id).length
                return (
                  <div
                    key={role.id}
                    className={`p-3 rounded-lg cursor-pointer flex items-center justify-between ${
                      selectedRole?.id === role.id
                        ? 'bg-white/20 border border-white/30'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                    onClick={() => setSelectedRole(role)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getRoleColorClass(role.color)}`}></div>
                      <div>
                        <span className="text-white font-medium">{role.name}</span>
                        {role.description && (
                          <p className="text-zinc-400 text-xs">{role.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 text-sm">{memberCount} 人</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteRole(role.id)
                        }}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* ロールメンバー管理 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="font-semibold text-white">
              {selectedRole ? (
                <span className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${getRoleColorClass(selectedRole.color)}`}></span>
                  {selectedRole.name} のメンバー
                </span>
              ) : (
                'ロールを選択してください'
              )}
            </h3>
          </CardHeader>
          <CardContent>
            {!selectedRole ? (
              <p className="text-zinc-400 text-center py-8">左のリストからロールを選択してください</p>
            ) : (
              <>
                {/* 現在のメンバー */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {roleMembers.length === 0 ? (
                    <p className="text-zinc-400 text-sm py-4 text-center">このロールのメンバーはいません</p>
                  ) : (
                    roleMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{member.display_name || 'Unknown'}</p>
                          <p className="text-zinc-400 text-xs">{member.membership_id}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          loading={saving === member.id}
                          onClick={() => handleRemoveRole(member.id)}
                        >
                          削除
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                {/* メンバー追加 */}
                <div className="mt-4 pt-4 border-t border-zinc-500/30">
                  <h4 className="text-sm font-medium text-zinc-300 mb-2">メンバーを追加</h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {nonRoleMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white text-sm">{member.display_name || 'Unknown'}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={saving === member.id}
                          onClick={() => handleAssignRole(member.id)}
                        >
                          + 追加
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Hub管理タブ
function HubsTab({ hubs }: { hubs: MasuHub[] }) {
  const router = useRouter()
  const [editingHub, setEditingHub] = useState<MasuHub | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newHub, setNewHub] = useState({
    name: '',
    description: '',
    country: '',
    city: '',
    address: '',
    lat: 0,
    lng: 0,
    google_maps_url: '',
    website_url: '',
    phone: '',
  })

  // Google Maps URL から座標を抽出
  const extractCoordsFromUrl = (url: string) => {
    // パターン1: @lat,lng
    const match1 = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (match1) {
      return { lat: parseFloat(match1[1]), lng: parseFloat(match1[2]) }
    }
    // パターン2: !3d{lat}!4d{lng}
    const match2 = url.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/)
    if (match2) {
      return { lat: parseFloat(match2[1]), lng: parseFloat(match2[2]) }
    }
    return null
  }

  const handleGoogleMapsUrlChange = (url: string, isEdit: boolean) => {
    const coords = extractCoordsFromUrl(url)
    if (isEdit && editingHub) {
      setEditingHub({
        ...editingHub,
        google_maps_url: url,
        ...(coords && { lat: coords.lat, lng: coords.lng }),
      })
    } else {
      setNewHub({
        ...newHub,
        google_maps_url: url,
        ...(coords && { lat: coords.lat, lng: coords.lng }),
      })
    }
  }

  const handleSaveHub = async () => {
    if (!editingHub) return
    setSaving(true)

    const supabase = createClient()
    await supabase
      .from('masu_hubs')
      .update({
        name: editingHub.name,
        description: editingHub.description,
        country: editingHub.country,
        city: editingHub.city,
        address: editingHub.address,
        lat: editingHub.lat,
        lng: editingHub.lng,
        google_maps_url: editingHub.google_maps_url,
        website_url: editingHub.website_url,
        phone: editingHub.phone,
        is_active: editingHub.is_active,
      })
      .eq('id', editingHub.id)

    setEditingHub(null)
    setSaving(false)
    router.refresh()
  }

  const handleAddHub = async () => {
    if (!newHub.name || !newHub.country || !newHub.city) return
    setSaving(true)

    // Geocoding（座標がない場合）
    let lat = newHub.lat
    let lng = newHub.lng

    if (lat === 0 && lng === 0 && newHub.address) {
      try {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          newHub.address
        )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`

        const response = await fetch(geocodeUrl)
        const data = await response.json()

        if (data.results && data.results[0]) {
          lat = data.results[0].geometry.location.lat
          lng = data.results[0].geometry.location.lng
        }
      } catch {
        // Geocoding failed - try city name next
      }
    }

    // それでも座標がない場合は都市名で検索
    if (lat === 0 && lng === 0) {
      try {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          `${newHub.city}, ${newHub.country}`
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
    }

    const supabase = createClient()
    const { data: insertedHub } = await supabase.from('masu_hubs').insert({
      name: newHub.name,
      description: newHub.description || null,
      country: newHub.country,
      city: newHub.city,
      address: newHub.address || null,
      lat,
      lng,
      google_maps_url: newHub.google_maps_url || null,
      website_url: newHub.website_url || null,
      phone: newHub.phone || null,
      is_active: true,
    }).select('id').single()

    // Google Maps URLがあれば自動で写真取得
    if (insertedHub && newHub.google_maps_url) {
      fetchHubPhoto(insertedHub.id, newHub.google_maps_url).catch(() => {})
    }

    setNewHub({ name: '', description: '', country: '', city: '', address: '', lat: 0, lng: 0, google_maps_url: '', website_url: '', phone: '' })
    setShowAddForm(false)
    setSaving(false)
    router.refresh()
  }

  const handleDeleteHub = async (hubId: string) => {
    if (!confirm('Are you sure you want to delete this hub?')) return

    const supabase = createClient()
    await supabase.from('masu_hubs').delete().eq('id', hubId)
    router.refresh()
  }

  // Google Maps写真取得
  const [fetchingPhoto, setFetchingPhoto] = useState<string | null>(null)
  const [fetchingAllPhotos, setFetchingAllPhotos] = useState(false)

  const fetchHubPhoto = async (hubId: string, googleMapsUrl: string) => {
    setFetchingPhoto(hubId)
    try {
      const res = await fetch('/api/hub/fetch-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hubId, googleMapsUrl }),
      })
      const result = await res.json()
      if (!res.ok) {
        console.error('Photo fetch failed:', result.error)
      }
    } catch {
      console.error('Photo fetch error')
    } finally {
      setFetchingPhoto(null)
    }
  }

  const handleFetchAllPhotos = async () => {
    const hubsWithoutPhoto = hubs.filter(h => !h.image_url && h.google_maps_url)
    if (hubsWithoutPhoto.length === 0) {
      alert('写真未取得のHub（Google Maps URLあり）はありません')
      return
    }
    if (!confirm(`${hubsWithoutPhoto.length}件のHubの写真をGoogleから取得します。よろしいですか？`)) return

    setFetchingAllPhotos(true)
    for (const hub of hubsWithoutPhoto) {
      await fetchHubPhoto(hub.id, hub.google_maps_url!)
      // API制限回避のため少し待つ
      await new Promise(r => setTimeout(r, 500))
    }
    setFetchingAllPhotos(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* 追加ボタン */}
      <div className="flex justify-end">
        <Button onClick={() => setShowAddForm(true)}>+ Add Hub</Button>
      </div>

      {/* 追加フォーム */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-white">Add New Hub</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Name"
                value={newHub.name}
                onChange={(e) => setNewHub({ ...newHub, name: e.target.value })}
                placeholder="Hub name"
              />
              <Input
                label="Description"
                value={newHub.description}
                onChange={(e) => setNewHub({ ...newHub, description: e.target.value })}
                placeholder="Optional description"
              />
              <Input
                label="Country"
                value={newHub.country}
                onChange={(e) => setNewHub({ ...newHub, country: e.target.value })}
                placeholder="Japan"
              />
              <Input
                label="City"
                value={newHub.city}
                onChange={(e) => setNewHub({ ...newHub, city: e.target.value })}
                placeholder="Tokyo"
              />
              <div className="md:col-span-2">
                <Input
                  label="Address"
                  value={newHub.address}
                  onChange={(e) => setNewHub({ ...newHub, address: e.target.value })}
                  placeholder="Full address"
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Google Maps URL"
                  value={newHub.google_maps_url}
                  onChange={(e) => handleGoogleMapsUrlChange(e.target.value, false)}
                  placeholder="https://www.google.com/maps/..."
                />
                <p className="text-xs text-zinc-400 mt-1">Google Maps URL を貼り付けると座標が自動入力されます</p>
              </div>
              <Input
                label="Website URL"
                value={newHub.website_url}
                onChange={(e) => setNewHub({ ...newHub, website_url: e.target.value })}
                placeholder="https://..."
              />
              <Input
                label="Phone"
                value={newHub.phone}
                onChange={(e) => setNewHub({ ...newHub, phone: e.target.value })}
                placeholder="+81-XXX-XXXX"
              />
              <Input
                label="Latitude"
                type="number"
                step="any"
                value={newHub.lat || ''}
                onChange={(e) => setNewHub({ ...newHub, lat: parseFloat(e.target.value) || 0 })}
                placeholder="35.6762"
              />
              <Input
                label="Longitude"
                type="number"
                step="any"
                value={newHub.lng || ''}
                onChange={(e) => setNewHub({ ...newHub, lng: parseFloat(e.target.value) || 0 })}
                placeholder="139.6503"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button onClick={handleAddHub} loading={saving}>Add Hub</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 編集モーダル */}
      {editingHub && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <h3 className="text-lg font-semibold text-white">Edit Hub</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Name"
                  value={editingHub.name}
                  onChange={(e) => setEditingHub({ ...editingHub, name: e.target.value })}
                />
                <Input
                  label="Description"
                  value={editingHub.description || ''}
                  onChange={(e) => setEditingHub({ ...editingHub, description: e.target.value })}
                />
                <Input
                  label="Country"
                  value={editingHub.country}
                  onChange={(e) => setEditingHub({ ...editingHub, country: e.target.value })}
                />
                <Input
                  label="City"
                  value={editingHub.city}
                  onChange={(e) => setEditingHub({ ...editingHub, city: e.target.value })}
                />
              </div>
              <Input
                label="Address"
                value={editingHub.address || ''}
                onChange={(e) => setEditingHub({ ...editingHub, address: e.target.value })}
              />
              <div>
                <Input
                  label="Google Maps URL"
                  value={editingHub.google_maps_url || ''}
                  onChange={(e) => handleGoogleMapsUrlChange(e.target.value, true)}
                />
                <p className="text-xs text-zinc-400 mt-1">Google Maps URL を貼り付けると座標が自動入力されます</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Website URL"
                  value={editingHub.website_url || ''}
                  onChange={(e) => setEditingHub({ ...editingHub, website_url: e.target.value })}
                />
                <Input
                  label="Phone"
                  value={editingHub.phone || ''}
                  onChange={(e) => setEditingHub({ ...editingHub, phone: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Latitude"
                  type="number"
                  step="any"
                  value={editingHub.lat}
                  onChange={(e) => setEditingHub({ ...editingHub, lat: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  label="Longitude"
                  type="number"
                  step="any"
                  value={editingHub.lng}
                  onChange={(e) => setEditingHub({ ...editingHub, lng: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingHub.is_active}
                  onChange={(e) => setEditingHub({ ...editingHub, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_active" className="text-sm text-zinc-300">Active</label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setEditingHub(null)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSaveHub} loading={saving} className="flex-1">
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hub一覧 */}
      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b border-zinc-500/30 flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleFetchAllPhotos}
              loading={fetchingAllPhotos}
              disabled={fetchingAllPhotos}
            >
              {fetchingAllPhotos ? '取得中...' : 'Google写真を一括取得'}
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-500/30">
                  <th className="text-left py-3 px-4 font-medium text-zinc-300">Photo</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-300">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-300">Location</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-300">Address</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-300">Links</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-300">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-zinc-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {hubs.map((hub) => (
                  <tr key={hub.id} className="border-b border-zinc-500/20 hover:bg-white/5">
                    <td className="py-3 px-4">
                      {hub.image_url ? (
                        <img src={hub.image_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : hub.google_maps_url ? (
                        <button
                          onClick={() => fetchHubPhoto(hub.id, hub.google_maps_url!)}
                          disabled={fetchingPhoto === hub.id}
                          className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-400 hover:bg-zinc-600 disabled:opacity-50"
                          title="Google写真を取得"
                        >
                          {fetchingPhoto === hub.id ? '...' : '📷'}
                        </button>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-500 text-xs">-</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-white">{hub.name}</p>
                      {hub.description && <p className="text-zinc-400 text-xs">{hub.description}</p>}
                    </td>
                    <td className="py-3 px-4 text-zinc-300">{hub.city}, {hub.country}</td>
                    <td className="py-3 px-4 text-zinc-400 text-xs max-w-[200px] truncate">{hub.address || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {hub.google_maps_url && (
                          <a href={hub.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                            Map
                          </a>
                        )}
                        {hub.website_url && (
                          <a href={hub.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                            Web
                          </a>
                        )}
                        {hub.phone && (
                          <span className="text-zinc-400">{hub.phone}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        hub.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {hub.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setEditingHub(hub)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-400" onClick={() => handleDeleteHub(hub.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 招待コードタブ
function InvitesTab({ invites }: { invites: SuperAdminDashboardProps['invites'] }) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [selectedType, setSelectedType] = useState<MembershipType>('standard')

  const handleCreateInvite = async () => {
    setCreating(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const code = generateInviteCode()
    await supabase.from('invites').insert({
      code,
      invited_by: user.id,
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

  return (
    <div className="space-y-4">
      {/* 生成フォーム */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-white">Generate Invite Code</h3>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-zinc-300 mb-1">Type</label>
              <select
                className="w-full px-3 py-2 border border-zinc-500/30 rounded-lg text-sm bg-white/10 text-white"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as MembershipType)}
              >
                <option value="standard" className="bg-zinc-900">Standard (Paid)</option>
                <option value="ambassador" className="bg-zinc-900">Ambassador (Free)</option>
                <option value="partner" className="bg-zinc-900">Partner (Free)</option>
              </select>
            </div>
            <Button onClick={handleCreateInvite} loading={creating}>Generate</Button>
          </div>
        </CardContent>
      </Card>

      {/* 招待コード一覧 */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-500/30">
                  <th className="text-left py-3 px-4 font-medium text-zinc-300">Code</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-300">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-300">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-300">Created</th>
                  <th className="text-right py-3 px-4 font-medium text-zinc-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((invite) => (
                  <tr key={invite.id} className="border-b border-zinc-500/20 hover:bg-white/5">
                    <td className="py-3 px-4 font-mono text-white">{invite.code}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-500/20 text-zinc-300">
                        {MEMBERSHIP_TYPE_LABELS[invite.membership_type]}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {invite.used ? (
                        <span className="text-zinc-400">Used by {invite.profiles?.display_name || 'Unknown'}</span>
                      ) : (
                        <span className="text-green-400">Available</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-400">{formatDate(invite.created_at)}</td>
                    <td className="py-3 px-4 text-right">
                      {!invite.used && (
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(invite.code)}>
                          Copy Link
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// オファータブ
function OffersTab({ offers }: { offers: SuperAdminDashboardProps['offers'] }) {
  const router = useRouter()

  const handleToggleActive = async (offerId: string, isActive: boolean) => {
    const supabase = createClient()
    await supabase
      .from('guild_offers')
      .update({ is_active: !isActive })
      .eq('id', offerId)
    router.refresh()
  }

  const handleDelete = async (offerId: string) => {
    if (!confirm('Delete this offer?')) return
    const supabase = createClient()
    await supabase.from('guild_offers').delete().eq('id', offerId)
    router.refresh()
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-500/30">
                <th className="text-left py-3 px-4 font-medium text-zinc-300">Title</th>
                <th className="text-left py-3 px-4 font-medium text-zinc-300">Type</th>
                <th className="text-left py-3 px-4 font-medium text-zinc-300">Min Rank</th>
                <th className="text-left py-3 px-4 font-medium text-zinc-300">Provider</th>
                <th className="text-left py-3 px-4 font-medium text-zinc-300">Status</th>
                <th className="text-right py-3 px-4 font-medium text-zinc-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer.id} className="border-b border-zinc-500/20 hover:bg-white/5">
                  <td className="py-3 px-4">
                    <p className="font-medium text-white">{offer.title}</p>
                    <p className="text-zinc-400 text-xs line-clamp-1">{offer.description}</p>
                  </td>
                  <td className="py-3 px-4 text-zinc-300">{offer.offer_type}</td>
                  <td className="py-3 px-4 text-zinc-300">{offer.min_rank}</td>
                  <td className="py-3 px-4 text-zinc-400">{offer.profiles?.display_name || '-'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      offer.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      {offer.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button size="sm" variant="ghost" onClick={() => handleToggleActive(offer.id, offer.is_active)}>
                      {offer.is_active ? 'Disable' : 'Enable'}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-400" onClick={() => handleDelete(offer.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// クエスト管理タブ
function QuestsManagementTab({ quests }: { quests: GuildQuest[] }) {
  const router = useRouter()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingQuest, setEditingQuest] = useState<GuildQuest | null>(null)
  const [saving, setSaving] = useState(false)
  const [newQuest, setNewQuest] = useState({
    title: '',
    description: '',
    image_url: '',
    points_reward: 10,
    quest_type: 'photo' as QuestType,
    is_repeatable: true,
  })

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

  const handleAddQuest = async () => {
    if (!newQuest.title || !newQuest.description) return
    setSaving(true)

    // 自動翻訳
    const [titleEn, descEn] = await Promise.all([
      autoTranslate(newQuest.title),
      autoTranslate(newQuest.description),
    ])

    const supabase = createClient()
    await supabase.from('guild_quests').insert({
      title: newQuest.title,
      description: newQuest.description,
      title_en: titleEn,
      description_en: descEn,
      image_url: newQuest.image_url || null,
      points_reward: newQuest.points_reward,
      quest_type: newQuest.quest_type,
      is_repeatable: newQuest.is_repeatable,
      is_active: true,
    })

    setNewQuest({
      title: '',
      description: '',
      image_url: '',
      points_reward: 10,
      quest_type: 'photo',
      is_repeatable: true,
    })
    setShowAddForm(false)
    setSaving(false)
    router.refresh()
  }

  const handleSaveQuest = async () => {
    if (!editingQuest) return
    setSaving(true)

    // 自動翻訳（タイトル・説明文が変更された場合のみ）
    const [titleEn, descEn] = await Promise.all([
      autoTranslate(editingQuest.title),
      autoTranslate(editingQuest.description),
    ])

    const supabase = createClient()
    await supabase
      .from('guild_quests')
      .update({
        title: editingQuest.title,
        description: editingQuest.description,
        title_en: titleEn,
        description_en: descEn,
        image_url: editingQuest.image_url,
        points_reward: editingQuest.points_reward,
        quest_type: editingQuest.quest_type,
        is_repeatable: editingQuest.is_repeatable,
        is_active: editingQuest.is_active,
      })
      .eq('id', editingQuest.id)

    setEditingQuest(null)
    setSaving(false)
    router.refresh()
  }

  const handleToggleActive = async (questId: string, isActive: boolean) => {
    const supabase = createClient()
    await supabase
      .from('guild_quests')
      .update({ is_active: !isActive })
      .eq('id', questId)
    router.refresh()
  }

  const handleDelete = async (questId: string) => {
    if (!confirm('Delete this quest? All submissions will also be deleted.')) return
    const supabase = createClient()
    await supabase.from('guild_quests').delete().eq('id', questId)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* 追加ボタン */}
      <div className="flex justify-end">
        <Button onClick={() => setShowAddForm(true)}>+ Add Quest</Button>
      </div>

      {/* 追加フォーム */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-white">Add New Quest</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Title"
                value={newQuest.title}
                onChange={(e) => setNewQuest({ ...newQuest, title: e.target.value })}
                placeholder="Quest title"
              />
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Type</label>
                <select
                  className="w-full px-3 py-2 border border-zinc-500/30 rounded-lg text-sm bg-white/10 text-white"
                  value={newQuest.quest_type}
                  onChange={(e) => setNewQuest({ ...newQuest, quest_type: e.target.value as QuestType })}
                >
                  <option value="photo" className="bg-zinc-900">Photo Quest</option>
                  <option value="checkin" className="bg-zinc-900">Check-in</option>
                  <option value="action" className="bg-zinc-900">Action</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-300 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-zinc-500/30 rounded-lg text-sm bg-white/10 text-white placeholder-zinc-300/50"
                  rows={3}
                  value={newQuest.description}
                  onChange={(e) => setNewQuest({ ...newQuest, description: e.target.value })}
                  placeholder="Describe the quest..."
                />
              </div>
              <Input
                label="Image URL (Optional)"
                value={newQuest.image_url}
                onChange={(e) => setNewQuest({ ...newQuest, image_url: e.target.value })}
                placeholder="https://..."
              />
              <Input
                label="Points Reward"
                type="number"
                value={newQuest.points_reward.toString()}
                onChange={(e) => setNewQuest({ ...newQuest, points_reward: parseInt(e.target.value) || 0 })}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_repeatable"
                  checked={newQuest.is_repeatable}
                  onChange={(e) => setNewQuest({ ...newQuest, is_repeatable: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_repeatable" className="text-sm text-zinc-300">
                  Repeatable (can submit multiple times)
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button onClick={handleAddQuest} loading={saving}>Add Quest</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 編集モーダル */}
      {editingQuest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <h3 className="text-lg font-semibold text-white">Edit Quest</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Title"
                value={editingQuest.title}
                onChange={(e) => setEditingQuest({ ...editingQuest, title: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Type</label>
                <select
                  className="w-full px-3 py-2 border border-zinc-500/30 rounded-lg text-sm bg-white/10 text-white"
                  value={editingQuest.quest_type}
                  onChange={(e) => setEditingQuest({ ...editingQuest, quest_type: e.target.value as QuestType })}
                >
                  <option value="photo" className="bg-zinc-900">Photo Quest</option>
                  <option value="checkin" className="bg-zinc-900">Check-in</option>
                  <option value="action" className="bg-zinc-900">Action</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-zinc-500/30 rounded-lg text-sm bg-white/10 text-white"
                  rows={3}
                  value={editingQuest.description}
                  onChange={(e) => setEditingQuest({ ...editingQuest, description: e.target.value })}
                />
              </div>
              <Input
                label="Image URL"
                value={editingQuest.image_url || ''}
                onChange={(e) => setEditingQuest({ ...editingQuest, image_url: e.target.value })}
              />
              <Input
                label="Points Reward"
                type="number"
                value={editingQuest.points_reward.toString()}
                onChange={(e) => setEditingQuest({ ...editingQuest, points_reward: parseInt(e.target.value) || 0 })}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit_is_repeatable"
                  checked={editingQuest.is_repeatable}
                  onChange={(e) => setEditingQuest({ ...editingQuest, is_repeatable: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="edit_is_repeatable" className="text-sm text-zinc-300">Repeatable</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={editingQuest.is_active}
                  onChange={(e) => setEditingQuest({ ...editingQuest, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="edit_is_active" className="text-sm text-zinc-300">Active</label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setEditingQuest(null)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSaveQuest} loading={saving} className="flex-1">
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* クエスト一覧 */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-500/30">
                  <th className="text-left py-3 px-4 font-medium text-zinc-300">Title</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-300">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-300">Points</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-300">Repeatable</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-300">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-zinc-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quests.map((quest) => (
                  <tr key={quest.id} className="border-b border-zinc-500/20 hover:bg-white/5">
                    <td className="py-3 px-4">
                      <p className="font-medium text-white">{quest.title}</p>
                      <p className="text-zinc-400 text-xs line-clamp-1">{quest.description}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-amber-500/20 rounded text-xs font-medium text-amber-300">
                        {quest.quest_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#c0c0c0] font-medium">+{quest.points_reward}</td>
                    <td className="py-3 px-4">
                      {quest.is_repeatable ? (
                        <span className="text-green-400 text-xs">Yes</span>
                      ) : (
                        <span className="text-zinc-400 text-xs">No</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        quest.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {quest.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setEditingQuest(quest)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleToggleActive(quest.id, quest.is_active)}>
                        {quest.is_active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-400" onClick={() => handleDelete(quest.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// クエスト投稿承認タブ
function QuestSubmissionsTab({ submissions, adminId }: { submissions: QuestSubmissionWithRelations[]; adminId: string }) {
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
