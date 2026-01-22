'use client'

import { useState, useCallback, useMemo } from 'react'
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps'
import { MasuHub, CustomRole, RoleColor, ROLE_COLOR_OPTIONS } from '@/types/database'
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
  instagram_id: string | null
  avatar_url?: string | null
  roles?: MemberRole[]
}

interface GuildMapProps {
  members: MemberMapData[]
  hubs: MasuHub[]
  userId?: string
  canViewMembers?: boolean
}

type MarkerType = 'member' | 'hub'

interface SelectedItem {
  type: MarkerType
  data: MemberMapData | MasuHub
}

export function GuildMap({ members, hubs, userId, canViewMembers = true }: GuildMapProps) {
  const { language } = useLanguage()
  const [showMembers, setShowMembers] = useState(canViewMembers)
  const [showHubs, setShowHubs] = useState(true)
  const [selected, setSelected] = useState<SelectedItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleMarkerClick = useCallback((type: MarkerType, data: MemberMapData | MasuHub) => {
    setSelected({ type, data })
  }, [])

  // フィルタリングされたメンバー
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      if (!m.lat || !m.lng) return false
      const query = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery ||
        m.display_name?.toLowerCase().includes(query) ||
        m.home_city?.toLowerCase().includes(query) ||
        m.home_country?.toLowerCase().includes(query)
      return matchesSearch
    })
  }, [members, searchQuery])

  // フィルタリングされた拠点
  const filteredHubs = useMemo(() => {
    return hubs.filter(h => {
      if (!h.is_active) return false
      const query = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery ||
        h.name.toLowerCase().includes(query) ||
        h.city.toLowerCase().includes(query) ||
        h.country.toLowerCase().includes(query)
      return matchesSearch
    })
  }, [hubs, searchQuery])

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return (
      <div className="w-full h-[500px] bg-white/10 backdrop-blur rounded-xl flex items-center justify-center border border-zinc-500/30">
        <p className="text-zinc-300">Google Maps API key is not configured</p>
      </div>
    )
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-zinc-900 p-4' : 'w-full'}`}>
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

        {/* トグルボタン */}
        <div className="flex gap-2 flex-wrap">
          {canViewMembers && (
            <button
              onClick={() => setShowMembers(!showMembers)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showMembers
                  ? 'bg-green-500 text-white'
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
                ? 'bg-orange-500 text-white'
                : 'bg-white/5 text-zinc-300 hover:bg-white/10'
            }`}
          >
            MASU Hubs
          </button>
          {/* 全画面ボタン */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center gap-2"
          >
            {isFullscreen ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                Fullscreen
              </>
            )}
          </button>
        </div>
      </div>

      {/* フィルター結果の表示 */}
      {searchQuery && (
        <div className="flex items-center gap-2 mb-3 text-sm text-zinc-300">
          <span>
            Showing: {filteredMembers.length} members, {filteredHubs.length} hubs
          </span>
          <button
            onClick={() => setSearchQuery('')}
            className="text-zinc-200 hover:text-white underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* マップ */}
      <div className={`w-full ${isFullscreen ? 'h-[calc(100vh-140px)]' : 'h-[500px]'} rounded-xl overflow-hidden shadow-lg border border-zinc-500/30`}>
        <APIProvider apiKey={apiKey} language={language}>
          <Map
            defaultCenter={{ lat: 35.6762, lng: 139.6503 }}
            defaultZoom={3}
            style={{ width: '100%', height: '100%' }}
          >
            {/* メンバーマーカー - アバター画像または緑色ピン */}
            {showMembers &&
              filteredMembers.map((member) => (
                <Marker
                  key={member.id}
                  position={{ lat: member.lat!, lng: member.lng! }}
                  onClick={() => handleMarkerClick('member', member)}
                  title={member.display_name || 'Member'}
                  icon={member.avatar_url ? {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg xmlns="http://www.w3.org/2000/svg" width="44" height="52" viewBox="0 0 44 52">
                        <defs>
                          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
                          </filter>
                          <clipPath id="circle">
                            <circle cx="22" cy="18" r="16"/>
                          </clipPath>
                        </defs>
                        <circle cx="22" cy="18" r="20" fill="#22c55e" filter="url(#shadow)"/>
                        <circle cx="22" cy="18" r="18" fill="white"/>
                        <image href="${member.avatar_url}" x="6" y="2" width="32" height="32" clip-path="url(#circle)" preserveAspectRatio="xMidYMid slice"/>
                        <polygon points="22,52 14,36 30,36" fill="#22c55e"/>
                      </svg>
                    `),
                    scaledSize: { width: 44, height: 52, equals: () => false },
                    anchor: { x: 22, y: 52, equals: () => false },
                  } : {
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

            {/* 枡拠点マーカー - オレンジ色ピン */}
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
      <div className="flex items-start gap-3">
        {/* アバター画像 */}
        {member.avatar_url ? (
          <img
            src={member.avatar_url}
            alt={member.display_name || 'Member'}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          />
        ) : member.instagram_id ? (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </div>
        ) : null}
        <div className="flex-1">
          <p className="font-semibold text-zinc-900">
            {member.display_name || 'Member'}
          </p>
          <p className="text-sm text-zinc-500">
            {member.home_city}, {member.home_country}
          </p>
        </div>
      </div>
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
      {/* Instagram リンク */}
      {member.instagram_id && (
        <a
          href={`https://instagram.com/${member.instagram_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs text-pink-500 hover:text-pink-600"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          @{member.instagram_id}
        </a>
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
