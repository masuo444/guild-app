'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Invite, Profile, MasuHub, Rank, MembershipType, MEMBERSHIP_TYPE_LABELS, isFreeMembershipType } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { generateInviteCode, formatDate } from '@/lib/utils'

interface AdminDashboardProps {
  invites: (Invite & { profiles: { display_name: string } | null })[]
  members: Profile[]
  hubs: MasuHub[]
  adminId: string
}

type Tab = 'invites' | 'members' | 'hubs' | 'offers'

export function AdminDashboard({ invites, members, hubs, adminId }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('invites')

  return (
    <div>
      {/* タブ */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {(['invites', 'members', 'hubs', 'offers'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* コンテンツ */}
      {activeTab === 'invites' && <InvitesTab invites={invites} adminId={adminId} />}
      {activeTab === 'members' && <MembersTab members={members} />}
      {activeTab === 'hubs' && <HubsTab hubs={hubs} />}
      {activeTab === 'offers' && <OffersTab />}
    </div>
  )
}

function InvitesTab({ invites, adminId }: { invites: AdminDashboardProps['invites']; adminId: string }) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [selectedType, setSelectedType] = useState<MembershipType>('standard')

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
        return 'bg-pink-100 text-pink-700'
      case 'ambassador':
        return 'bg-purple-100 text-purple-700'
      case 'staff':
        return 'bg-blue-100 text-blue-700'
      case 'partner':
        return 'bg-amber-100 text-amber-700'
      default:
        return 'bg-zinc-100 text-zinc-700'
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-row items-center justify-between">
          <div>
            <h2 className="font-semibold text-zinc-900">Invite Codes</h2>
            <p className="text-sm text-zinc-500">
              {unusedCount} unused / {invites.length} total
            </p>
          </div>
        </div>
        {/* 招待コード生成フォーム */}
        <div className="flex flex-row items-end gap-3 p-4 bg-zinc-50 rounded-lg">
          <div className="flex-1">
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Member Type
            </label>
            <select
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as MembershipType)}
            >
              <option value="standard">Standard (Paid)</option>
              <option value="model">Model (Free)</option>
              <option value="ambassador">Ambassador (Free)</option>
              <option value="staff">Staff (Free)</option>
              <option value="partner">Partner (Free)</option>
            </select>
          </div>
          <Button onClick={handleCreateInvite} loading={creating} size="sm">
            Generate Code
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                invite.used ? 'bg-zinc-50' : 'bg-green-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-medium text-zinc-900">{invite.code}</p>
                    {invite.membership_type && invite.membership_type !== 'standard' && (
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getTypeBgColor(invite.membership_type)}`}>
                        {MEMBERSHIP_TYPE_LABELS[invite.membership_type]}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">
                    {invite.used
                      ? `Used by ${invite.profiles?.display_name || 'Unknown'}`
                      : isFreeMembershipType(invite.membership_type) ? 'Free Invitation' : 'Available'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">{formatDate(invite.created_at)}</span>
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

  return (
    <div className="space-y-4">
      {/* ポイント付与フォーム */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-zinc-900">Award Points</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              className="px-3 py-2 border border-zinc-300 rounded-lg text-sm"
              value={selectedMember?.id || ''}
              onChange={(e) => {
                const member = members.find((m) => m.id === e.target.value)
                setSelectedMember(member || null)
              }}
            >
              <option value="">Select member...</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
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
          <h2 className="font-semibold text-zinc-900">All Members ({members.length})</h2>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left py-2 font-medium text-zinc-600">Name</th>
                  <th className="text-left py-2 font-medium text-zinc-600">Membership ID</th>
                  <th className="text-left py-2 font-medium text-zinc-600">Type</th>
                  <th className="text-left py-2 font-medium text-zinc-600">Status</th>
                  <th className="text-left py-2 font-medium text-zinc-600">Location</th>
                  <th className="text-left py-2 font-medium text-zinc-600">Joined</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const memberType = member.membership_type || 'standard'
                  const typeColors: Record<MembershipType, string> = {
                    standard: 'bg-zinc-100 text-zinc-700',
                    model: 'bg-pink-100 text-pink-700',
                    ambassador: 'bg-purple-100 text-purple-700',
                    staff: 'bg-blue-100 text-blue-700',
                    partner: 'bg-amber-100 text-amber-700',
                  }
                  return (
                    <tr key={member.id} className="border-b border-zinc-100">
                      <td className="py-2">
                        <span className="font-medium text-zinc-900">
                          {member.display_name || '-'}
                        </span>
                        {member.role === 'admin' && (
                          <span className="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                            Admin
                          </span>
                        )}
                      </td>
                      <td className="py-2 font-mono text-zinc-600">{member.membership_id || '-'}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[memberType]}`}>
                          {MEMBERSHIP_TYPE_LABELS[memberType]}
                        </span>
                      </td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            member.subscription_status === 'active' || member.subscription_status === 'free'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {member.subscription_status === 'free' ? 'Free' : member.subscription_status}
                        </span>
                      </td>
                      <td className="py-2 text-zinc-600">
                        {member.home_city && member.home_country
                          ? `${member.home_city}, ${member.home_country}`
                          : '-'}
                      </td>
                      <td className="py-2 text-zinc-500">{formatDate(member.created_at)}</td>
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
    } catch (error) {
      console.error('Geocoding error:', error)
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
          <h2 className="font-semibold text-zinc-900">MASU Hubs ({hubs.length})</h2>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add Hub'}
          </Button>
        </CardHeader>
        <CardContent>
          {showForm && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-zinc-50 rounded-lg">
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
                className={`p-3 rounded-lg ${hub.is_active ? 'bg-amber-50' : 'bg-zinc-50'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-zinc-900">{hub.name}</p>
                    <p className="text-sm text-zinc-500">
                      {hub.city}, {hub.country}
                    </p>
                    {hub.description && (
                      <p className="text-xs text-zinc-400 mt-1">{hub.description}</p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      hub.is_active ? 'bg-green-100 text-green-700' : 'bg-zinc-200 text-zinc-600'
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
        <h2 className="font-semibold text-zinc-900">Create Offer</h2>
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
            <label className="block text-sm font-medium text-zinc-700 mb-1">Type</label>
            <select
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm"
              value={formData.offer_type}
              onChange={(e) => setFormData({ ...formData, offer_type: e.target.value })}
            >
              <option value="Discount">Discount</option>
              <option value="Access">Access</option>
              <option value="Service">Service</option>
              <option value="Product">Product</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the offer..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Minimum Rank Required
            </label>
            <select
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm"
              value={formData.min_rank}
              onChange={(e) =>
                setFormData({ ...formData, min_rank: e.target.value as Rank })
              }
            >
              <option value="D">D (All members)</option>
              <option value="C">C (100+ points)</option>
              <option value="B">B (300+ points)</option>
              <option value="A">A (800+ points)</option>
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
