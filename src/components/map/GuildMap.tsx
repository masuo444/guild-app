'use client'

import { useState, useCallback } from 'react'
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

  const handleMarkerClick = useCallback((type: MarkerType, data: MemberMapData | MasuHub) => {
    setSelected({ type, data })
  }, [])

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
      {/* トグルボタン */}
      <div className="flex gap-3 mb-4">
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
              members
                .filter((m) => m.lat && m.lng)
                .map((member) => (
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
              hubs
                .filter((h) => h.is_active)
                .map((hub) => (
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
