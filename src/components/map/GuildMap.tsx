'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps'
import { MasuHub, CustomRole, RoleColor, ROLE_COLOR_OPTIONS } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n'

interface MemberRole {
  role_id: string
  role: CustomRole
}

interface MemberMapData {
  id: string
  display_name: string | null
  home_country: string | null
  home_city: string | null
  lat: number | null
  lng: number | null
  roles?: MemberRole[]
}

interface GuildMapProps {
  members: MemberMapData[]
  hubs: MasuHub[]
  userId?: string
  canViewMembers?: boolean
  canRegisterHub?: boolean
}

type MarkerType = 'member' | 'hub'

interface SelectedItem {
  type: MarkerType
  data: MemberMapData | MasuHub
}

interface HubFormData {
  name: string
  description: string
  country: string
  city: string
  lat: number
  lng: number
}

export function GuildMap({ members, hubs, userId, canViewMembers = true, canRegisterHub = true }: GuildMapProps) {
  const router = useRouter()
  const { language, t } = useLanguage()
  const [showMembers, setShowMembers] = useState(canViewMembers)
  const [showHubs, setShowHubs] = useState(true)
  const [selected, setSelected] = useState<SelectedItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')

  // 拠点登録モーダル
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSelectingLocation, setIsSelectingLocation] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<HubFormData>({
    name: '',
    description: '',
    country: '',
    city: '',
    lat: 0,
    lng: 0,
  })

  const handleMarkerClick = useCallback((type: MarkerType, data: MemberMapData | MasuHub) => {
    if (isSelectingLocation) return
    setSelected({ type, data })
  }, [isSelectingLocation])

  const handleMapClick = useCallback((e: { detail: { latLng: { lat: number; lng: number } | null } }) => {
    if (isSelectingLocation && e.detail.latLng) {
      setFormData(prev => ({
        ...prev,
        lat: e.detail.latLng!.lat,
        lng: e.detail.latLng!.lng,
      }))
      setIsSelectingLocation(false)
    }
  }, [isSelectingLocation])

  const handleSubmitHub = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('masu_hubs')
      .insert({
        name: formData.name,
        description: formData.description || null,
        country: formData.country,
        city: formData.city,
        lat: formData.lat,
        lng: formData.lng,
        owner_id: userId,
        is_active: true,
      })

    setSaving(false)

    if (!error) {
      setShowAddModal(false)
      setFormData({ name: '', description: '', country: '', city: '', lat: 0, lng: 0 })
      router.refresh()
    }
  }

  // 国リストを生成（メンバーと拠点の両方から）
  const countries = useMemo(() => {
    const countrySet = new Set<string>()
    members.forEach(m => {
      if (m.home_country) countrySet.add(m.home_country)
    })
    hubs.forEach(h => {
      if (h.country) countrySet.add(h.country)
    })
    return Array.from(countrySet).sort()
  }, [members, hubs])

  // フィルタリングされたメンバー
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      if (!m.lat || !m.lng) return false
      const query = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery ||
        m.display_name?.toLowerCase().includes(query) ||
        m.home_city?.toLowerCase().includes(query) ||
        m.home_country?.toLowerCase().includes(query)
      const matchesCountry = !selectedCountry || m.home_country === selectedCountry
      return matchesSearch && matchesCountry
    })
  }, [members, searchQuery, selectedCountry])

  // フィルタリングされた拠点
  const filteredHubs = useMemo(() => {
    return hubs.filter(h => {
      if (!h.is_active) return false
      const query = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery ||
        h.name.toLowerCase().includes(query) ||
        h.city.toLowerCase().includes(query) ||
        h.country.toLowerCase().includes(query)
      const matchesCountry = !selectedCountry || h.country === selectedCountry
      return matchesSearch && matchesCountry
    })
  }, [hubs, searchQuery, selectedCountry])

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return (
      <div className="w-full h-[500px] bg-white/10 backdrop-blur rounded-xl flex items-center justify-center border border-zinc-500/30">
        <p className="text-zinc-300">Google Maps API key is not configured</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* 検索・フィルターバー */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* 検索入力 */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by name, city, country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur border border-zinc-500/30 rounded-lg text-sm text-white placeholder-zinc-300/50 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0] focus:border-transparent"
          />
        </div>

        {/* 国フィルター */}
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="px-4 py-2 bg-white/10 backdrop-blur border border-zinc-500/30 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#c0c0c0] focus:border-transparent"
        >
          <option value="" className="bg-zinc-900">All Countries</option>
          {countries.map((country) => (
            <option key={country} value={country} className="bg-zinc-900">
              {country}
            </option>
          ))}
        </select>

        {/* トグルボタン */}
        <div className="flex gap-2">
          {canViewMembers && (
            <button
              onClick={() => setShowMembers(!showMembers)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showMembers
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-zinc-300 hover:bg-white/10'
              }`}
            >
              Members
            </button>
          )}
          <button
            onClick={() => setShowHubs(!showHubs)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showHubs
                ? 'bg-[#c0c0c0] text-zinc-900'
                : 'bg-white/5 text-zinc-300 hover:bg-white/10'
            }`}
          >
            MASU Hubs
          </button>
          {userId && canRegisterHub && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[#c0c0c0] text-zinc-900 hover:bg-white transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add My Shop
            </button>
          )}
        </div>
      </div>

      {/* フィルター結果の表示 */}
      {(searchQuery || selectedCountry) && (
        <div className="flex items-center gap-2 mb-3 text-sm text-zinc-300">
          <span>
            Showing: {filteredMembers.length} members, {filteredHubs.length} hubs
          </span>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedCountry('')
            }}
            className="text-zinc-200 hover:text-white underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* 位置選択モード表示 */}
      {isSelectingLocation && (
        <div className="mb-3 p-3 bg-[#c0c0c0]/20 border border-[#c0c0c0] rounded-lg text-sm text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-[#c0c0c0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Click on the map to select your shop location
          <button
            onClick={() => setIsSelectingLocation(false)}
            className="ml-auto text-zinc-300 hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}

      {/* マップ */}
      <div className={`w-full h-[500px] rounded-xl overflow-hidden shadow-lg border border-zinc-500/30 ${isSelectingLocation ? 'cursor-crosshair' : ''}`}>
        <APIProvider apiKey={apiKey} language={language}>
          <Map
            defaultCenter={{ lat: 35.6762, lng: 139.6503 }}
            defaultZoom={3}
            style={{ width: '100%', height: '100%' }}
            onClick={handleMapClick}
          >
            {/* メンバーマーカー - 緑色ピン */}
            {showMembers &&
              filteredMembers.map((member) => (
                <Marker
                  key={member.id}
                  position={{ lat: member.lat!, lng: member.lng! }}
                  onClick={() => handleMarkerClick('member', member)}
                  title={member.display_name || 'Member'}
                  icon={{
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">
                        <defs>
                          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.3"/>
                          </filter>
                        </defs>
                        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z" fill="#22c55e" filter="url(#shadow)"/>
                        <circle cx="12" cy="12" r="5" fill="white"/>
                      </svg>
                    `),
                    scaledSize: { width: 24, height: 36, equals: () => false },
                    anchor: { x: 12, y: 36, equals: () => false },
                  }}
                />
              ))}

            {/* 枡拠点マーカー - オレンジピン */}
            {showHubs &&
              filteredHubs.map((hub) => (
                <Marker
                  key={hub.id}
                  position={{ lat: hub.lat, lng: hub.lng }}
                  onClick={() => handleMarkerClick('hub', hub)}
                  title={hub.name}
                  icon={{
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">
                        <defs>
                          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.3"/>
                          </filter>
                        </defs>
                        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z" fill="#f97316" filter="url(#shadow)"/>
                        <circle cx="12" cy="12" r="5" fill="white"/>
                      </svg>
                    `),
                    scaledSize: { width: 24, height: 36, equals: () => false },
                    anchor: { x: 12, y: 36, equals: () => false },
                  }}
                />
              ))}

            {/* 新規登録位置マーカー */}
            {formData.lat !== 0 && formData.lng !== 0 && showAddModal && (
              <Marker
                position={{ lat: formData.lat, lng: formData.lng }}
                title="New Location"
              />
            )}

            {/* 情報ウィンドウ */}
            {selected && (
              <InfoWindow
                position={{
                  lat: selected.type === 'member'
                    ? (selected.data as MemberMapData).lat!
                    : (selected.data as MasuHub).lat,
                  lng: selected.type === 'member'
                    ? (selected.data as MemberMapData).lng!
                    : (selected.data as MasuHub).lng,
                }}
                onCloseClick={() => setSelected(null)}
              >
                {selected.type === 'member' ? (
                  <MemberInfoCard member={selected.data as MemberMapData} />
                ) : (
                  <HubInfoCard hub={selected.data as MasuHub} />
                )}
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>

      {/* MASU Hubs リスト */}
      {showHubs && filteredHubs.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
            MASU Hubs ({filteredHubs.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHubs.map((hub) => (
              <div
                key={hub.id}
                onClick={() => setSelected({ type: 'hub', data: hub })}
                className="bg-white/10 backdrop-blur border border-zinc-500/30 rounded-lg p-4 cursor-pointer hover:bg-white/20 transition-colors"
              >
                {hub.image_url && (
                  <img
                    src={hub.image_url}
                    alt={hub.name}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                )}
                <h4 className="font-semibold text-white mb-1">{hub.name}</h4>
                <p className="text-sm text-zinc-400 mb-2">
                  {hub.city}, {hub.country}
                </p>
                {hub.description && (
                  <p className="text-xs text-zinc-500 line-clamp-2">{hub.description}</p>
                )}
                <div className="mt-3 flex gap-2">
                  {hub.google_maps_url && (
                    <a
                      href={hub.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-orange-400 hover:text-orange-300"
                    >
                      Maps →
                    </a>
                  )}
                  {hub.website_url && (
                    <a
                      href={hub.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-orange-400 hover:text-orange-300"
                    >
                      Website →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 拠点登録モーダル */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-500/30 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Add My Shop</h3>
            <form onSubmit={handleSubmitHub} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-300 mb-1">Shop Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-zinc-500/30 rounded-lg text-white placeholder-zinc-300/50 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
                  placeholder="My MASU Shop"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-zinc-500/30 rounded-lg text-white placeholder-zinc-300/50 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0] resize-none"
                  rows={3}
                  placeholder="Tell us about your shop..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-300 mb-1">Country *</label>
                  <input
                    type="text"
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-zinc-500/30 rounded-lg text-white placeholder-zinc-300/50 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
                    placeholder="Japan"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-300 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-zinc-500/30 rounded-lg text-white placeholder-zinc-300/50 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
                    placeholder="Tokyo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-300 mb-1">Location *</label>
                {formData.lat !== 0 && formData.lng !== 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm">
                      {formData.lat.toFixed(4)}, {formData.lng.toFixed(4)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSelectingLocation(true)
                        setShowAddModal(false)
                        setTimeout(() => setShowAddModal(true), 100)
                      }}
                      className="text-[#c0c0c0] text-sm underline hover:text-zinc-200"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsSelectingLocation(true)}
                    className="w-full px-4 py-2 bg-[#c0c0c0]/20 border border-[#c0c0c0] rounded-lg text-[#c0c0c0] hover:bg-[#c0c0c0]/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Click on Map to Select Location
                  </button>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setFormData({ name: '', description: '', country: '', city: '', lat: 0, lng: 0 })
                    setIsSelectingLocation(false)
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 border border-zinc-500/30 rounded-lg text-white hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || formData.lat === 0 || formData.lng === 0}
                  className="flex-1 px-4 py-2 bg-[#c0c0c0] text-zinc-900 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {saving ? 'Saving...' : 'Add Shop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function MemberInfoCard({ member }: { member: MemberMapData }) {
  const getRoleColor = (color: RoleColor) => {
    const option = ROLE_COLOR_OPTIONS.find(o => o.value === color)
    return option?.bg || 'bg-gray-500'
  }

  return (
    <div className="p-2 min-w-[180px]">
      <p className="font-semibold text-zinc-900">
        {member.display_name || 'Member'}
      </p>
      <p className="text-sm text-zinc-500">
        {member.home_city}, {member.home_country}
      </p>
      {member.roles && member.roles.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {member.roles.map((mr) => (
            <span
              key={mr.role_id}
              className={`px-2 py-0.5 text-xs text-white rounded-full ${getRoleColor(mr.role.color)}`}
            >
              {mr.role.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function HubInfoCard({ hub }: { hub: MasuHub }) {
  return (
    <div className="p-2 min-w-[200px] max-w-[280px]">
      {hub.image_url && (
        <div className="mb-2 -mx-2 -mt-2">
          <img
            src={hub.image_url}
            alt={hub.name}
            className="w-full h-32 object-cover rounded-t"
          />
        </div>
      )}
      <p className="font-semibold text-zinc-900">{hub.name}</p>
      <p className="text-sm text-zinc-500 mb-1">
        {hub.city}, {hub.country}
      </p>
      {hub.description && (
        <p className="text-xs text-zinc-600 mb-2">{hub.description}</p>
      )}
      {hub.address && (
        <p className="text-xs text-zinc-500 mb-1">📍 {hub.address}</p>
      )}
      {hub.google_maps_url && (
        <a
          href={hub.google_maps_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline block mb-1"
        >
          Google Mapsで開く →
        </a>
      )}
      {hub.website_url && (
        <a
          href={hub.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline block mb-1"
        >
          ウェブサイト →
        </a>
      )}
      {hub.phone && (
        <p className="text-xs text-zinc-500">📞 {hub.phone}</p>
      )}
    </div>
  )
}
