'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps'
import { MasuHub, CustomRole, RoleColor, ROLE_COLOR_OPTIONS } from '@/types/database'
import { useLanguage } from '@/lib/i18n'

// Pending invite data for map markers
interface PendingInviteMapData {
  id: string
  code: string
  target_name: string | null
  target_country: string | null
  target_city: string | null
  target_lat: number
  target_lng: number
  membership_type: string
}

// Apply offset to all markers (members + hubs + pending invites) sharing the same coordinates
type OffsetItem = { type: 'member'; data: MemberMapData } | { type: 'hub'; data: MasuHub } | { type: 'pending'; data: PendingInviteMapData }

function applyAllCoordinateOffsets(
  members: MemberMapData[],
  hubs: MasuHub[],
  pendingInvites: PendingInviteMapData[] = []
): {
  members: (MemberMapData & { offsetLat: number; offsetLng: number })[]
  hubs: (MasuHub & { offsetLat: number; offsetLng: number })[]
  pending: (PendingInviteMapData & { offsetLat: number; offsetLng: number })[]
} {
  // Group all markers by exact coordinates
  const groups: Record<string, OffsetItem[]> = {}
  for (const member of members) {
    if (!member.lat || !member.lng) continue
    const key = `${member.lat},${member.lng}`
    if (!groups[key]) groups[key] = []
    groups[key].push({ type: 'member', data: member })
  }
  for (const hub of hubs) {
    if (!hub.lat || !hub.lng) continue
    const key = `${hub.lat},${hub.lng}`
    if (!groups[key]) groups[key] = []
    groups[key].push({ type: 'hub', data: hub })
  }
  for (const invite of pendingInvites) {
    const key = `${invite.target_lat},${invite.target_lng}`
    if (!groups[key]) groups[key] = []
    groups[key].push({ type: 'pending', data: invite })
  }

  const resultMembers: (MemberMapData & { offsetLat: number; offsetLng: number })[] = []
  const resultHubs: (MasuHub & { offsetLat: number; offsetLng: number })[] = []
  const resultPending: (PendingInviteMapData & { offsetLat: number; offsetLng: number })[] = []

  for (const group of Object.values(groups)) {
    if (group.length === 1) {
      const item = group[0]
      if (item.type === 'member') {
        resultMembers.push({ ...item.data, offsetLat: item.data.lat!, offsetLng: item.data.lng! })
      } else if (item.type === 'hub') {
        resultHubs.push({ ...item.data, offsetLat: item.data.lat, offsetLng: item.data.lng })
      } else {
        resultPending.push({ ...item.data, offsetLat: item.data.target_lat, offsetLng: item.data.target_lng })
      }
    } else {
      const radius = 0.006 // ~600m offset
      for (let i = 0; i < group.length; i++) {
        const angle = (2 * Math.PI * i) / group.length
        const item = group[i]
        if (item.type === 'member') {
          resultMembers.push({
            ...item.data,
            offsetLat: item.data.lat! + radius * Math.cos(angle),
            offsetLng: item.data.lng! + radius * Math.sin(angle),
          })
        } else if (item.type === 'hub') {
          resultHubs.push({
            ...item.data,
            offsetLat: item.data.lat + radius * Math.cos(angle),
            offsetLng: item.data.lng + radius * Math.sin(angle),
          })
        } else {
          resultPending.push({
            ...item.data,
            offsetLat: item.data.target_lat + radius * Math.cos(angle),
            offsetLng: item.data.target_lng + radius * Math.sin(angle),
          })
        }
      }
    }
  }
  return { members: resultMembers, hubs: resultHubs, pending: resultPending }
}

// Calculate marker size based on zoom level (circle style)
function getMarkerSize(zoom: number): { base: number; avatar: number } {
  if (zoom <= 3) {
    return { base: 20, avatar: 28 }
  } else if (zoom <= 5) {
    return { base: 24, avatar: 32 }
  } else if (zoom <= 8) {
    return { base: 28, avatar: 36 }
  } else if (zoom <= 10) {
    return { base: 32, avatar: 40 }
  } else if (zoom <= 13) {
    return { base: 36, avatar: 44 }
  } else {
    return { base: 44, avatar: 52 }
  }
}

// Generate circle SVG for members with avatar (base64 embedded)
function getMemberAvatarMarkerSvg(base64DataUrl: string, size: number): string {
  const r = size / 2
  const border = Math.max(2, r * 0.12)
  const imgR = r - border
  return `
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.4"/>
        </filter>
        <clipPath id="avatarClip">
          <circle cx="${r}" cy="${r}" r="${imgR}"/>
        </clipPath>
      </defs>
      <circle cx="${r}" cy="${r}" r="${r - 1}" fill="#22c55e" filter="url(#shadow)"/>
      <circle cx="${r}" cy="${r}" r="${imgR}" fill="white"/>
      <image href="${base64DataUrl}" x="${border}" y="${border}" width="${imgR * 2}" height="${imgR * 2}" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid slice"/>
    </svg>
  `
}

// Preload avatar image and convert to base64 data URL
async function loadAvatarAsBase64(url: string): Promise<string> {
  // Use fetch to avoid CORS issues with crossOrigin='anonymous' on Image
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch image')
  const blob = await res.blob()
  const bitmapUrl = URL.createObjectURL(blob)
  try {
    return await new Promise<string>((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const size = 80
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject('No canvas context'); return }
        const min = Math.min(img.width, img.height)
        const sx = (img.width - min) / 2
        const sy = (img.height - min) / 2
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.onerror = () => reject('Failed to load')
      img.src = bitmapUrl
    })
  } finally {
    URL.revokeObjectURL(bitmapUrl)
  }
}

// Generate circle SVG for members without avatar
function getMemberDotMarkerSvg(size: number): string {
  const r = size / 2
  const innerR = r * 0.45
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.4"/>
        </filter>
      </defs>
      <circle cx="${r}" cy="${r}" r="${r - 1}" fill="#22c55e" filter="url(#shadow)"/>
      <circle cx="${r}" cy="${r}" r="${innerR}" fill="white"/>
    </svg>
  `
}

// Generate circle SVG for hubs without image
function getHubMarkerSvg(size: number): string {
  const r = size / 2
  const innerR = r * 0.45
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.4"/>
        </filter>
      </defs>
      <circle cx="${r}" cy="${r}" r="${r - 1}" fill="#f97316" filter="url(#shadow)"/>
      <circle cx="${r}" cy="${r}" r="${innerR}" fill="white"/>
    </svg>
  `
}

// Generate circle SVG for hubs with image (base64 embedded)
function getHubImageMarkerSvg(base64DataUrl: string, size: number): string {
  const r = size / 2
  const border = Math.max(2, r * 0.12)
  const imgR = r - border
  return `
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.4"/>
        </filter>
        <clipPath id="hubClip">
          <circle cx="${r}" cy="${r}" r="${imgR}"/>
        </clipPath>
      </defs>
      <circle cx="${r}" cy="${r}" r="${r - 1}" fill="#f97316" filter="url(#shadow)"/>
      <circle cx="${r}" cy="${r}" r="${imgR}" fill="white"/>
      <image href="${base64DataUrl}" x="${border}" y="${border}" width="${imgR * 2}" height="${imgR * 2}" clip-path="url(#hubClip)" preserveAspectRatio="xMidYMid slice"/>
    </svg>
  `
}

// Generate circle SVG for pending invites (purple)
function getPendingMarkerSvg(size: number): string {
  const r = size / 2
  const innerR = r * 0.45
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.4"/>
        </filter>
      </defs>
      <circle cx="${r}" cy="${r}" r="${r - 1}" fill="#a855f7" filter="url(#shadow)"/>
      <circle cx="${r}" cy="${r}" r="${innerR}" fill="white"/>
    </svg>
  `
}

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
  pendingInvites?: PendingInviteMapData[]
  userId?: string
  canViewMembers?: boolean
}

type MarkerType = 'member' | 'hub' | 'pending'

interface SelectedItem {
  type: MarkerType
  data: MemberMapData | MasuHub | PendingInviteMapData
}

// Inner component that can use useMap() hook inside <Map>
function MapMarkers({
  showMembers,
  showHubs,
  showPending,
  filteredMembers,
  filteredHubs,
  filteredPending,
  markerSizes,
  avatarCache,
  onMarkerClick,
}: {
  showMembers: boolean
  showHubs: boolean
  showPending: boolean
  filteredMembers: (MemberMapData & { offsetLat: number; offsetLng: number })[]
  filteredHubs: (MasuHub & { offsetLat: number; offsetLng: number })[]
  filteredPending: (PendingInviteMapData & { offsetLat: number; offsetLng: number })[]
  markerSizes: { base: number; avatar: number }
  avatarCache: Record<string, string>
  onMarkerClick: (type: MarkerType, data: MemberMapData | MasuHub | PendingInviteMapData, lat: number, lng: number) => void
}) {
  return (
    <>
      {showMembers &&
        filteredMembers.map((member) => {
          const cachedBase64 = member.avatar_url ? avatarCache[member.avatar_url] : undefined
          const size = cachedBase64 ? markerSizes.avatar : markerSizes.base
          return (
            <Marker
              key={member.id}
              position={{ lat: member.offsetLat, lng: member.offsetLng }}
              onClick={() => onMarkerClick('member', member, member.offsetLat, member.offsetLng)}
              title={member.display_name || 'Member'}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                  cachedBase64
                    ? getMemberAvatarMarkerSvg(cachedBase64, size)
                    : getMemberDotMarkerSvg(size)
                ),
                scaledSize: { width: size, height: size, equals: () => false },
                anchor: { x: size / 2, y: size / 2, equals: () => false },
              }}
            />
          )
        })}
      {showHubs &&
        filteredHubs.map((hub) => {
          const cachedHubBase64 = hub.image_url ? avatarCache[hub.image_url] : undefined
          const size = cachedHubBase64 ? markerSizes.avatar : markerSizes.base
          return (
            <Marker
              key={hub.id}
              position={{ lat: hub.offsetLat, lng: hub.offsetLng }}
              onClick={() => onMarkerClick('hub', hub, hub.offsetLat, hub.offsetLng)}
              title={hub.name}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                  cachedHubBase64
                    ? getHubImageMarkerSvg(cachedHubBase64, size)
                    : getHubMarkerSvg(size)
                ),
                scaledSize: { width: size, height: size, equals: () => false },
                anchor: { x: size / 2, y: size / 2, equals: () => false },
              }}
            />
          )
        })}
      {showPending &&
        filteredPending.map((invite) => {
          const size = markerSizes.base
          return (
            <Marker
              key={`pending-${invite.id}`}
              position={{ lat: invite.offsetLat, lng: invite.offsetLng }}
              onClick={() => onMarkerClick('pending', invite, invite.offsetLat, invite.offsetLng)}
              title={invite.target_name || 'Pending'}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(getPendingMarkerSvg(size)),
                scaledSize: { width: size, height: size, equals: () => false },
                anchor: { x: size / 2, y: size / 2, equals: () => false },
              }}
            />
          )
        })}
    </>
  )
}

export function GuildMap({ members, hubs, pendingInvites = [], userId, canViewMembers = true }: GuildMapProps) {
  const { language, setLanguage, t } = useLanguage()

  // マップの言語切替はGoogle Maps JS APIの再読み込みが必要なためリロード
  const toggleMapLanguage = () => {
    setLanguage(language === 'ja' ? 'en' : 'ja')
    window.location.reload()
  }
  const [showMembers, setShowMembers] = useState(canViewMembers)
  const [showHubs, setShowHubs] = useState(true)
  const [showPending, setShowPending] = useState(true)
  const [selected, setSelected] = useState<SelectedItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(3)
  const mapRef = useRef<google.maps.Map | null>(null)
  const fullscreenMapRef = useRef<google.maps.Map | null>(null)

  // Avatar base64 cache: avatar_url -> base64 data URL
  const [avatarCache, setAvatarCache] = useState<Record<string, string>>({})

  // Preload avatar/hub images as base64
  useEffect(() => {
    const urls: string[] = []
    members.forEach(m => { if (m.avatar_url) urls.push(m.avatar_url) })
    hubs.forEach(h => { if (h.image_url) urls.push(h.image_url) })
    if (urls.length === 0) return

    let mounted = true
    urls.forEach(url => {
      if (avatarCache[url]) return // already cached
      loadAvatarAsBase64(url).then(base64 => {
        if (mounted) {
          setAvatarCache(prev => ({ ...prev, [url]: base64 }))
        }
      }).catch(() => {/* ignore failed loads */})
    })

    return () => { mounted = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, hubs])

  // Get current marker sizes based on zoom
  const markerSizes = useMemo(() => getMarkerSize(zoomLevel), [zoomLevel])

  // Prevent body scroll when fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden'
      const bottomNav = document.querySelector('[data-bottom-nav]')
      if (bottomNav) {
        (bottomNav as HTMLElement).style.display = 'none'
      }
    } else {
      document.body.style.overflow = ''
      const bottomNav = document.querySelector('[data-bottom-nav]')
      if (bottomNav) {
        (bottomNav as HTMLElement).style.display = ''
      }
    }
    return () => {
      document.body.style.overflow = ''
      const bottomNav = document.querySelector('[data-bottom-nav]')
      if (bottomNav) {
        (bottomNav as HTMLElement).style.display = ''
      }
    }
  }, [isFullscreen])

  const handleMarkerClick = useCallback((type: MarkerType, data: MemberMapData | MasuHub | PendingInviteMapData, lat: number, lng: number) => {
    setSelected({ type, data })
    // ピンクリック時にスムーズにズームイン
    const map = isFullscreen ? fullscreenMapRef.current : mapRef.current
    if (map) {
      map.panTo({ lat, lng })
      const currentZoom = map.getZoom() || 3
      const targetZoom = 10
      if (currentZoom < targetZoom) {
        let zoom = currentZoom
        const step = () => {
          zoom = Math.min(zoom + 0.5, targetZoom)
          map.setZoom(zoom)
          if (zoom < targetZoom) {
            requestAnimationFrame(step)
          }
        }
        requestAnimationFrame(step)
      }
    }
  }, [isFullscreen])

  // Filtered members, hubs, and pending invites with coordinate offset applied
  const { filteredMembers, filteredHubs, filteredPending } = useMemo(() => {
    const mFiltered = members.filter(m => {
      if (!m.lat || !m.lng) return false
      const query = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery ||
        m.display_name?.toLowerCase().includes(query) ||
        m.home_city?.toLowerCase().includes(query) ||
        m.home_country?.toLowerCase().includes(query)
      return matchesSearch
    })
    const hFiltered = hubs.filter(h => {
      if (!h.is_active) return false
      const query = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery ||
        h.name.toLowerCase().includes(query) ||
        h.city.toLowerCase().includes(query) ||
        h.country.toLowerCase().includes(query)
      return matchesSearch
    })
    const pFiltered = pendingInvites.filter(p => {
      const query = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery ||
        p.target_name?.toLowerCase().includes(query) ||
        p.target_city?.toLowerCase().includes(query) ||
        p.target_country?.toLowerCase().includes(query)
      return matchesSearch
    })
    const offsets = applyAllCoordinateOffsets(mFiltered, hFiltered, pFiltered)
    return { filteredMembers: offsets.members, filteredHubs: offsets.hubs, filteredPending: offsets.pending }
  }, [members, hubs, pendingInvites, searchQuery])

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return (
      <div className="w-full h-[500px] bg-white/10 backdrop-blur rounded-xl flex items-center justify-center border border-zinc-500/30">
        <p className="text-zinc-300">Google Maps API key is not configured</p>
      </div>
    )
  }

  // Fullscreen mode - Google Maps style UI
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-zinc-900">
        {/* Map takes full screen */}
        <div className="absolute inset-0">
          <APIProvider apiKey={apiKey} language={language} key={`map-fs-${language}`}>
            <Map
              defaultCenter={{ lat: 35.6762, lng: 139.6503 }}
              defaultZoom={3}
              style={{ width: '100%', height: '100%' }}
              gestureHandling="greedy"
              disableDefaultUI={true}
              zoomControl={false}
              mapTypeControl={false}
              streetViewControl={false}
              fullscreenControl={false}
              onCameraChanged={(e) => setZoomLevel(Math.round(e.detail.zoom))}
              onTilesLoaded={(e) => { fullscreenMapRef.current = (e as unknown as { map: google.maps.Map }).map }}
            >
              <MapMarkers
                showMembers={showMembers}
                showHubs={showHubs}
                showPending={showPending}
                filteredMembers={filteredMembers}
                filteredHubs={filteredHubs}
                filteredPending={filteredPending}
                markerSizes={markerSizes}
                avatarCache={avatarCache}
                onMarkerClick={handleMarkerClick}
              />
            </Map>
          </APIProvider>
        </div>

        {/* Top overlay - Search bar */}
        <div className="absolute top-0 left-0 right-0 pt-[env(safe-area-inset-top)] px-4 pb-2">
          <div className="flex items-center gap-3 mt-3">
            {/* Close button */}
            <button
              onClick={() => setIsFullscreen(false)}
              className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center flex-shrink-0"
            >
              <svg className="w-5 h-5 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Search input */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white rounded-full shadow-lg text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-zinc-200 rounded-full flex items-center justify-center"
                >
                  <svg className="w-3 h-3 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Language toggle */}
            <button
              onClick={toggleMapLanguage}
              className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center flex-shrink-0 text-sm font-bold text-zinc-700"
            >
              {language === 'ja' ? 'EN' : 'JA'}
            </button>
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            {canViewMembers && (
              <button
                onClick={() => setShowMembers(!showMembers)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shadow-md transition-all flex items-center gap-1.5 ${
                  showMembers
                    ? 'bg-green-500 text-white'
                    : 'bg-white text-zinc-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${showMembers ? 'bg-white' : 'bg-green-500'}`} />
                {t.membersCount} ({filteredMembers.length})
              </button>
            )}
            <button
              onClick={() => setShowHubs(!showHubs)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shadow-md transition-all flex items-center gap-1.5 ${
                showHubs
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-zinc-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${showHubs ? 'bg-white' : 'bg-orange-500'}`} />
              {t.hubsCount} ({filteredHubs.length})
            </button>
            {canViewMembers && filteredPending.length > 0 && (
              <button
                onClick={() => setShowPending(!showPending)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shadow-md transition-all flex items-center gap-1.5 ${
                  showPending
                    ? 'bg-purple-500 text-white'
                    : 'bg-white text-zinc-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${showPending ? 'bg-white' : 'bg-purple-500'}`} />
                {t.pendingInvites} ({filteredPending.length})
              </button>
            )}
          </div>
        </div>

        {/* Right side floating buttons */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
          {/* Zoom in */}
          <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          {/* Zoom out */}
          <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
        </div>

        {/* Bottom sheet for selected item */}
        {selected && (
          <div className="absolute bottom-0 left-0 right-0 pb-[env(safe-area-inset-bottom)]">
            <div className="bg-white rounded-t-3xl shadow-2xl mx-2 mb-2 overflow-hidden animate-slide-up">
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-zinc-300 rounded-full" />
              </div>

              {/* Close button */}
              <button
                onClick={() => setSelected(null)}
                className="absolute top-3 right-3 w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Content */}
              <div className="px-4 pb-4">
                {selected.type === 'member' ? (
                  <MemberBottomSheet member={selected.data as MemberMapData} />
                ) : selected.type === 'hub' ? (
                  <HubBottomSheet hub={selected.data as MasuHub} />
                ) : (
                  <PendingBottomSheet invite={selected.data as PendingInviteMapData} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Normal mode (non-fullscreen)
  return (
    <div className="w-full">
      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Search input */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur border border-zinc-500/30 rounded-lg text-sm text-white placeholder-zinc-300/50 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0] focus:border-transparent"
          />
        </div>

        {/* Toggle buttons */}
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
              {t.membersCount}
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
            {t.masuHubs}
          </button>
          {canViewMembers && filteredPending.length > 0 && (
            <button
              onClick={() => setShowPending(!showPending)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showPending
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/5 text-zinc-300 hover:bg-white/10'
              }`}
            >
              {t.pendingInvites}
            </button>
          )}
          {/* Language toggle */}
          <button
            onClick={toggleMapLanguage}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-white/10 text-zinc-300 hover:bg-white/20 transition-colors"
          >
            {language === 'ja' ? 'EN' : 'JA'}
          </button>
          {/* Fullscreen button */}
          <button
            onClick={() => setIsFullscreen(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span className="hidden sm:inline">{t.fullscreen}</span>
          </button>
        </div>
      </div>

      {/* Filter results */}
      {searchQuery && (
        <div className="flex items-center gap-2 mb-3 text-sm text-zinc-300">
          <span>
            {t.showingResults}: {filteredMembers.length} {t.membersCount}, {filteredHubs.length} {t.hubsCount}{filteredPending.length > 0 ? `, ${filteredPending.length} ${t.pendingInvites}` : ''}
          </span>
          <button
            onClick={() => setSearchQuery('')}
            className="text-zinc-200 hover:text-white underline"
          >
            {t.clear}
          </button>
        </div>
      )}

      {/* Map container with expand hint on mobile */}
      <div className="relative">
        <div className="w-full h-[400px] sm:h-[500px] rounded-xl overflow-hidden shadow-lg border border-zinc-500/30">
          <APIProvider apiKey={apiKey} language={language} key={`map-${language}`}>
            <Map
              defaultCenter={{ lat: 35.6762, lng: 139.6503 }}
              defaultZoom={3}
              style={{ width: '100%', height: '100%' }}
              gestureHandling="greedy"
              onCameraChanged={(e) => setZoomLevel(Math.round(e.detail.zoom))}
              onTilesLoaded={(e) => { mapRef.current = (e as unknown as { map: google.maps.Map }).map }}
            >
              <MapMarkers
                showMembers={showMembers}
                showHubs={showHubs}
                showPending={showPending}
                filteredMembers={filteredMembers}
                filteredHubs={filteredHubs}
                filteredPending={filteredPending}
                markerSizes={markerSizes}
                avatarCache={avatarCache}
                onMarkerClick={handleMarkerClick}
              />
            </Map>
          </APIProvider>
        </div>

        {/* Expand hint on mobile */}
        <button
          onClick={() => setIsFullscreen(true)}
          className="sm:hidden absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/90 backdrop-blur rounded-full shadow-lg text-sm font-medium text-zinc-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          {t.viewFullscreen}
        </button>
      </div>

      {/* Selected item card (non-fullscreen) */}
      {selected && (
        <div className="mt-4 bg-white/10 backdrop-blur rounded-xl border border-zinc-500/30 p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {selected.type === 'member' ? (
                <MemberInfoCard member={selected.data as MemberMapData} />
              ) : selected.type === 'hub' ? (
                <HubInfoCard hub={selected.data as MasuHub} />
              ) : (
                <PendingInfoCard invite={selected.data as PendingInviteMapData} />
              )}
            </div>
            <button
              onClick={() => setSelected(null)}
              className="ml-2 p-1 text-zinc-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Bottom sheet components for fullscreen mode
function MemberBottomSheet({ member }: { member: MemberMapData }) {
  const getRoleColor = (color: RoleColor) => {
    const option = ROLE_COLOR_OPTIONS.find(o => o.value === color)
    return option?.bg || 'bg-gray-500'
  }

  return (
    <div className="flex items-start gap-4">
      {/* Avatar */}
      {member.avatar_url ? (
        <img
          src={member.avatar_url}
          alt={member.display_name || 'Member'}
          className="w-16 h-16 rounded-full object-cover flex-shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden') }}
        />
      ) : null}
      <div className={`w-16 h-16 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 ${member.avatar_url ? 'hidden' : ''}`}>
        <span className="text-2xl text-white font-bold">
          {member.display_name?.[0]?.toUpperCase() || 'M'}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-zinc-900 truncate">
          {member.display_name || 'Member'}
        </h3>
        <p className="text-sm text-zinc-500">
          {member.home_city}, {member.home_country}
        </p>

        {/* Roles */}
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

        {/* Instagram link */}
        {member.instagram_id && (
          <a
            href={`https://instagram.com/${member.instagram_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-pink-500 hover:text-pink-600"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            @{member.instagram_id}
          </a>
        )}
      </div>
    </div>
  )
}

function HubBottomSheet({ hub }: { hub: MasuHub }) {
  return (
    <div>
      {/* Image area - always show */}
      <div className="mb-3 -mx-4 -mt-1">
        {hub.image_url ? (
          <img
            src={hub.image_url}
            alt={hub.name}
            className="w-full h-36 object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden') }}
          />
        ) : null}
        <div className={`w-full h-36 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center ${hub.image_url ? 'hidden' : ''}`}>
          <svg className="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-zinc-900">{hub.name}</h3>
      <p className="text-sm text-zinc-500 mb-2">
        {hub.city}, {hub.country}
      </p>

      {hub.description && (
        <p className="text-sm text-zinc-600 mb-3">{hub.description}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {hub.google_maps_url && (
          <a
            href={hub.google_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-medium flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Google Maps
          </a>
        )}
        {hub.website_url && (
          <a
            href={hub.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-zinc-200 text-zinc-700 rounded-full text-sm font-medium flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            Website
          </a>
        )}
      </div>
    </div>
  )
}

// Regular info card components for non-fullscreen mode
function MemberInfoCard({ member }: { member: MemberMapData }) {
  const getRoleColor = (color: RoleColor) => {
    const option = ROLE_COLOR_OPTIONS.find(o => o.value === color)
    return option?.bg || 'bg-gray-500'
  }

  return (
    <div className="flex items-start gap-3">
      {member.avatar_url ? (
        <img
          src={member.avatar_url}
          alt={member.display_name || 'Member'}
          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden') }}
        />
      ) : null}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${member.avatar_url ? 'hidden' : ''} ${member.instagram_id ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500' : 'bg-green-500'}`}>
        {member.instagram_id ? (
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        ) : (
          <span className="text-lg text-white font-bold">
            {member.display_name?.[0]?.toUpperCase() || 'M'}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">
          {member.display_name || 'Member'}
        </p>
        <p className="text-sm text-zinc-400">
          {member.home_city}, {member.home_country}
        </p>
        {member.roles && member.roles.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
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
        {member.instagram_id && (
          <a
            href={`https://instagram.com/${member.instagram_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            @{member.instagram_id}
          </a>
        )}
      </div>
    </div>
  )
}

function HubInfoCard({ hub }: { hub: MasuHub }) {
  return (
    <div>
      <div className="flex items-start gap-3">
        {hub.image_url ? (
          <img
            src={hub.image_url}
            alt={hub.name}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden') }}
          />
        ) : null}
        <div className={`w-16 h-16 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 ${hub.image_url ? 'hidden' : ''}`}>
          <svg className="w-8 h-8 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate">{hub.name}</p>
          <p className="text-sm text-zinc-400 mb-1">
            {hub.city}, {hub.country}
          </p>
          {hub.description && (
            <p className="text-xs text-zinc-300 line-clamp-2">{hub.description}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        {hub.google_maps_url && (
          <a
            href={hub.google_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/30"
          >
            Google Maps
          </a>
        )}
        {hub.website_url && (
          <a
            href={hub.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-zinc-500/20 text-zinc-300 rounded-lg text-xs font-medium hover:bg-zinc-500/30"
          >
            Website
          </a>
        )}
      </div>
    </div>
  )
}

// Pending invite bottom sheet for fullscreen mode
function PendingBottomSheet({ invite }: { invite: PendingInviteMapData }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
        <span className="text-2xl text-white font-bold">
          {invite.target_name?.[0]?.toUpperCase() || '?'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-zinc-900 truncate">
          {invite.target_name || 'Pending Member'}
        </h3>
        <p className="text-sm text-zinc-500">
          {[invite.target_city, invite.target_country].filter(Boolean).join(', ')}
        </p>
        <span className="mt-2 inline-block px-3 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full">
          {invite.membership_type.charAt(0).toUpperCase() + invite.membership_type.slice(1)}
        </span>
      </div>
    </div>
  )
}

// Pending invite info card for non-fullscreen mode
function PendingInfoCard({ invite }: { invite: PendingInviteMapData }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
        <span className="text-lg text-white font-bold">
          {invite.target_name?.[0]?.toUpperCase() || '?'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">
          {invite.target_name || 'Pending Member'}
        </p>
        <p className="text-sm text-zinc-400">
          {[invite.target_city, invite.target_country].filter(Boolean).join(', ')}
        </p>
        <span className="mt-1 inline-block px-2 py-0.5 text-xs font-medium text-purple-300 bg-purple-500/20 rounded-full border border-purple-500/30">
          {invite.membership_type.charAt(0).toUpperCase() + invite.membership_type.slice(1)}
        </span>
      </div>
    </div>
  )
}
