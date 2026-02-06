'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps'
import { MasuHub, CustomRole, RoleColor, ROLE_COLOR_OPTIONS } from '@/types/database'
import { useLanguage } from '@/lib/i18n'

// Apply offset to members sharing the same coordinates
function applyCoordinateOffset(members: MemberMapData[]): (MemberMapData & { offsetLat: number; offsetLng: number })[] {
  // Group members by exact coordinates
  const groups: Record<string, MemberMapData[]> = {}
  for (const member of members) {
    if (!member.lat || !member.lng) continue
    const key = `${member.lat},${member.lng}`
    if (!groups[key]) groups[key] = []
    groups[key].push(member)
  }

  const result: (MemberMapData & { offsetLat: number; offsetLng: number })[] = []
  for (const group of Object.values(groups)) {
    if (group.length === 1) {
      // No offset needed for single members
      result.push({ ...group[0], offsetLat: group[0].lat!, offsetLng: group[0].lng! })
    } else {
      // Spread members in a circle around the original point
      const radius = 0.006 // ~600m offset
      for (let i = 0; i < group.length; i++) {
        const angle = (2 * Math.PI * i) / group.length
        const offsetLat = group[i].lat! + radius * Math.cos(angle)
        const offsetLng = group[i].lng! + radius * Math.sin(angle)
        result.push({ ...group[i], offsetLat, offsetLng })
      }
    }
  }
  return result
}

// Calculate marker size based on zoom level (emoji-style small markers)
function getMarkerSize(zoom: number): { base: number; avatar: number } {
  if (zoom <= 3) {
    return { base: 14, avatar: 20 }
  } else if (zoom <= 5) {
    return { base: 16, avatar: 24 }
  } else if (zoom <= 8) {
    return { base: 20, avatar: 28 }
  } else if (zoom <= 10) {
    return { base: 24, avatar: 32 }
  } else if (zoom <= 13) {
    return { base: 28, avatar: 38 }
  } else {
    return { base: 32, avatar: 44 }
  }
}

// Generate emoji-style circular marker SVG for members with avatar
function getMemberAvatarMarkerSvg(avatarUrl: string, size: number): string {
  const borderWidth = Math.max(2, size / 10)
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.3"/>
        </filter>
        <clipPath id="avatarClip">
          <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - borderWidth}"/>
        </clipPath>
      </defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#22c55e" filter="url(#shadow)"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - borderWidth}" fill="white"/>
      <image href="${avatarUrl}" x="${borderWidth}" y="${borderWidth}" width="${size - borderWidth * 2}" height="${size - borderWidth * 2}" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid slice"/>
    </svg>
  `
}

// Generate emoji-style circular marker SVG for members without avatar
function getMemberDotMarkerSvg(size: number): string {
  const borderWidth = Math.max(2, size / 8)
  const innerRadius = size / 2 - borderWidth
  const dotRadius = innerRadius * 0.5
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.3"/>
        </filter>
      </defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#22c55e" filter="url(#shadow)"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${innerRadius}" fill="white"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${dotRadius}" fill="#22c55e"/>
    </svg>
  `
}

// Generate emoji-style circular marker SVG for hubs
function getHubMarkerSvg(size: number): string {
  const borderWidth = Math.max(2, size / 8)
  const innerRadius = size / 2 - borderWidth
  const dotRadius = innerRadius * 0.5
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.3"/>
        </filter>
      </defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#f97316" filter="url(#shadow)"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${innerRadius}" fill="white"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${dotRadius}" fill="#f97316"/>
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
  userId?: string
  canViewMembers?: boolean
}

type MarkerType = 'member' | 'hub'

interface SelectedItem {
  type: MarkerType
  data: MemberMapData | MasuHub
}

export function GuildMap({ members, hubs, userId, canViewMembers = true }: GuildMapProps) {
  const { language, t } = useLanguage()
  const [showMembers, setShowMembers] = useState(canViewMembers)
  const [showHubs, setShowHubs] = useState(true)
  const [selected, setSelected] = useState<SelectedItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(3)

  // Get current marker sizes based on zoom
  const markerSizes = useMemo(() => getMarkerSize(zoomLevel), [zoomLevel])

  // Prevent body scroll when fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden'
      // Hide bottom navigation if exists
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

  const handleMarkerClick = useCallback((type: MarkerType, data: MemberMapData | MasuHub) => {
    setSelected({ type, data })
  }, [])

  // Filtered members with coordinate offset applied
  const filteredMembers = useMemo(() => {
    const filtered = members.filter(m => {
      if (!m.lat || !m.lng) return false
      const query = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery ||
        m.display_name?.toLowerCase().includes(query) ||
        m.home_city?.toLowerCase().includes(query) ||
        m.home_country?.toLowerCase().includes(query)
      return matchesSearch
    })
    return applyCoordinateOffset(filtered)
  }, [members, searchQuery])

  // Filtered hubs
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

  // Fullscreen mode - Google Maps style UI
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-zinc-900">
        {/* Map takes full screen */}
        <div className="absolute inset-0">
          <APIProvider apiKey={apiKey} language={language}>
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
            >
              {/* Member markers - emoji-style circles */}
              {showMembers &&
                filteredMembers.map((member) => {
                  const size = member.avatar_url ? markerSizes.avatar : markerSizes.base
                  return (
                    <Marker
                      key={member.id}
                      position={{ lat: member.offsetLat, lng: member.offsetLng }}
                      onClick={() => handleMarkerClick('member', member)}
                      title={member.display_name || 'Member'}
                      icon={{
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                          member.avatar_url
                            ? getMemberAvatarMarkerSvg(member.avatar_url, size)
                            : getMemberDotMarkerSvg(size)
                        ),
                        scaledSize: { width: size, height: size, equals: () => false },
                        anchor: { x: size / 2, y: size / 2, equals: () => false },
                      }}
                    />
                  )
                })}

              {/* Hub markers - emoji-style circles */}
              {showHubs &&
                filteredHubs.map((hub) => {
                  const size = markerSizes.base
                  return (
                    <Marker
                      key={hub.id}
                      position={{ lat: hub.lat, lng: hub.lng }}
                      onClick={() => handleMarkerClick('hub', hub)}
                      title={hub.name}
                      icon={{
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(getHubMarkerSvg(size)),
                        scaledSize: { width: size, height: size, equals: () => false },
                        anchor: { x: size / 2, y: size / 2, equals: () => false },
                      }}
                    />
                  )
                })}
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
                ) : (
                  <HubBottomSheet hub={selected.data as MasuHub} />
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
            {t.showingResults}: {filteredMembers.length} {t.membersCount}, {filteredHubs.length} {t.hubsCount}
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
          <APIProvider apiKey={apiKey} language={language}>
            <Map
              defaultCenter={{ lat: 35.6762, lng: 139.6503 }}
              defaultZoom={3}
              style={{ width: '100%', height: '100%' }}
              gestureHandling="greedy"
              onCameraChanged={(e) => setZoomLevel(Math.round(e.detail.zoom))}
            >
              {/* Member markers - emoji-style circles */}
              {showMembers &&
                filteredMembers.map((member) => {
                  const size = member.avatar_url ? markerSizes.avatar : markerSizes.base
                  return (
                    <Marker
                      key={member.id}
                      position={{ lat: member.offsetLat, lng: member.offsetLng }}
                      onClick={() => handleMarkerClick('member', member)}
                      title={member.display_name || 'Member'}
                      icon={{
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
                          member.avatar_url
                            ? getMemberAvatarMarkerSvg(member.avatar_url, size)
                            : getMemberDotMarkerSvg(size)
                        ),
                        scaledSize: { width: size, height: size, equals: () => false },
                        anchor: { x: size / 2, y: size / 2, equals: () => false },
                      }}
                    />
                  )
                })}

              {/* Hub markers - emoji-style circles */}
              {showHubs &&
                filteredHubs.map((hub) => {
                  const size = markerSizes.base
                  return (
                    <Marker
                      key={hub.id}
                      position={{ lat: hub.lat, lng: hub.lng }}
                      onClick={() => handleMarkerClick('hub', hub)}
                      title={hub.name}
                      icon={{
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(getHubMarkerSvg(size)),
                        scaledSize: { width: size, height: size, equals: () => false },
                        anchor: { x: size / 2, y: size / 2, equals: () => false },
                      }}
                    />
                  )
                })}
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
              ) : (
                <HubInfoCard hub={selected.data as MasuHub} />
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
        />
      ) : (
        <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl text-white font-bold">
            {member.display_name?.[0]?.toUpperCase() || 'M'}
          </span>
        </div>
      )}

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
          />
        ) : (
          <div className="w-full h-36 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
            <svg className="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}
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
        />
      ) : member.instagram_id ? (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        </div>
      ) : (
        <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
          <span className="text-lg text-white font-bold">
            {member.display_name?.[0]?.toUpperCase() || 'M'}
          </span>
        </div>
      )}
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
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-8 h-8 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}
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
