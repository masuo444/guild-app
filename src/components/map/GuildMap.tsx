'use client'

import { useState, useCallback, useMemo } from 'react'
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps'
import { MasuHub } from '@/types/database'

interface MemberMapData {
  id: string
  display_name: string | null
  home_country: string | null
  home_city: string | null
  lat: number | null
  lng: number | null
}

interface GuildMapProps {
  members: MemberMapData[]
  hubs: MasuHub[]
}

type MarkerType = 'member' | 'hub'

interface SelectedItem {
  type: MarkerType
  data: MemberMapData | MasuHub
}

export function GuildMap({ members, hubs }: GuildMapProps) {
  const [showMembers, setShowMembers] = useState(true)
  const [showHubs, setShowHubs] = useState(true)
  const [selected, setSelected] = useState<SelectedItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')

  const handleMarkerClick = useCallback((type: MarkerType, data: MemberMapData | MasuHub) => {
    setSelected({ type, data })
  }, [])

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
      <div className="w-full h-[500px] bg-zinc-100 rounded-xl flex items-center justify-center">
        <p className="text-zinc-500">Google Maps API key is not configured</p>
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
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
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
            className="w-full pl-10 pr-4 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
          />
        </div>

        {/* 国フィルター */}
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="px-4 py-2 border border-zinc-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
        >
          <option value="">All Countries</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>

        {/* トグルボタン */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowMembers(!showMembers)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showMembers
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Members
          </button>
          <button
            onClick={() => setShowHubs(!showHubs)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showHubs
                ? 'bg-amber-500 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            MASU Hubs
          </button>
        </div>
      </div>

      {/* フィルター結果の表示 */}
      {(searchQuery || selectedCountry) && (
        <div className="flex items-center gap-2 mb-3 text-sm text-zinc-600">
          <span>
            Showing: {filteredMembers.length} members, {filteredHubs.length} hubs
          </span>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedCountry('')
            }}
            className="text-zinc-500 hover:text-zinc-700 underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* マップ */}
      <div className="w-full h-[500px] rounded-xl overflow-hidden shadow-lg">
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={{ lat: 35.6762, lng: 139.6503 }}
            defaultZoom={3}
            mapId="fomus-guild-map"
            style={{ width: '100%', height: '100%' }}
          >
            {/* メンバーマーカー */}
            {showMembers &&
              filteredMembers.map((member) => (
                <AdvancedMarker
                  key={member.id}
                  position={{ lat: member.lat!, lng: member.lng! }}
                  onClick={() => handleMarkerClick('member', member)}
                >
                  <div className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white">
                    {(member.display_name || 'M')[0].toUpperCase()}
                  </div>
                </AdvancedMarker>
              ))}

            {/* 枡拠点マーカー */}
            {showHubs &&
              filteredHubs.map((hub) => (
                  <AdvancedMarker
                    key={hub.id}
                    position={{ lat: hub.lat, lng: hub.lng }}
                    onClick={() => handleMarkerClick('hub', hub)}
                  >
                    <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center text-white shadow-lg border-2 border-white">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                  </AdvancedMarker>
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
  return (
    <div className="p-2 min-w-[150px]">
      <p className="font-semibold text-zinc-900">
        {member.display_name || 'Member'}
      </p>
      <p className="text-sm text-zinc-500">
        {member.home_city}, {member.home_country}
      </p>
    </div>
  )
}

function HubInfoCard({ hub }: { hub: MasuHub }) {
  return (
    <div className="p-2 min-w-[180px]">
      <p className="font-semibold text-zinc-900">{hub.name}</p>
      <p className="text-sm text-zinc-500 mb-1">
        {hub.city}, {hub.country}
      </p>
      {hub.description && (
        <p className="text-xs text-zinc-600">{hub.description}</p>
      )}
    </div>
  )
}
