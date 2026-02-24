'use client'

import { useLanguage } from '@/lib/i18n'

// Map page header with localized text
export function MapPageHeader({ canSeeMembers }: { canSeeMembers: boolean }) {
  const { t } = useLanguage()
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">{t.guildMap}</h1>
      <p className="text-zinc-300">
        {canSeeMembers ? t.exploreMembers : t.exploreHubs}
      </p>
    </div>
  )
}

// Map upgrade banner
export function MapUpgradeBanner() {
  const { t } = useLanguage()
  return (
    <div className="mb-6 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-xl p-4 border border-zinc-500/30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#c0c0c0]/20 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-[#c0c0c0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-white">{t.upgradeSeeMembers}</h3>
          <p className="text-xs text-zinc-400">{t.upgradeSeeMembersDesc}</p>
        </div>
        <a
          href="/auth/subscribe"
          className="px-4 py-2 bg-[#c0c0c0] text-zinc-900 rounded-lg text-sm font-medium hover:bg-white transition-colors flex-shrink-0"
        >
          {t.upgrade}
        </a>
      </div>
    </div>
  )
}

// MASU Hubs section header (kept for backward compat)
export function MasuHubsSectionHeader({ count }: { count: number }) {
  const { t } = useLanguage()
  return (
    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
        <svg className="w-3 h-3 text-orange-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      {t.masuHubs} ({count})
    </h2>
  )
}

// MASU Hubs grid with country filter
import { useState, useMemo } from 'react'

type Hub = {
  id: string
  name: string
  description: string | null
  country: string
  city: string
  image_url: string | null
}

const countryNameJa: Record<string, string> = {
  Japan: '日本',
  Ireland: 'アイルランド',
  USA: 'アメリカ',
  Portugal: 'ポルトガル',
  Georgia: 'ジョージア',
  UAE: 'UAE',
  Philippines: 'フィリピン',
  Vietnam: 'ベトナム',
  Malaysia: 'マレーシア',
  Taiwan: '台湾',
}

export function HubGridWithFilter({ hubs }: { hubs: Hub[] }) {
  const { language, t } = useLanguage()
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const localizeCountry = (country: string) =>
    language === 'ja' ? (countryNameJa[country] || country) : country

  const countries = useMemo(() => {
    const countryCount = new Map<string, number>()
    hubs.forEach(h => countryCount.set(h.country, (countryCount.get(h.country) || 0) + 1))
    return Array.from(countryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([country, count]) => ({ country, count }))
  }, [hubs])

  const filtered = selectedCountry ? hubs.filter(h => h.country === selectedCountry) : hubs

  return (
    <>
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-orange-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        {t.masuHubs} ({filtered.length})
      </h2>

      {/* Country filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedCountry(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors touch-manipulation ${
            !selectedCountry
              ? 'bg-orange-500 text-white'
              : 'bg-white/10 text-zinc-300 hover:bg-white/20 border border-zinc-500/30'
          }`}
        >
          {t.allCountries} ({hubs.length})
        </button>
        {countries.map(({ country, count }) => (
          <button
            key={country}
            onClick={() => setSelectedCountry(selectedCountry === country ? null : country)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors touch-manipulation ${
              selectedCountry === country
                ? 'bg-orange-500 text-white'
                : 'bg-white/10 text-zinc-300 hover:bg-white/20 border border-zinc-500/30'
            }`}
          >
            {localizeCountry(country)} ({count})
          </button>
        ))}
      </div>

      {/* Hub grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((hub) => {
          const isExpanded = expandedId === hub.id
          return (
            <div
              key={hub.id}
              className="bg-white/10 backdrop-blur rounded-lg border border-zinc-500/30 overflow-hidden hover:border-orange-500/50 transition-colors cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : hub.id)}
            >
              {hub.image_url ? (
                <img
                  src={hub.image_url}
                  alt={hub.name}
                  className="w-full h-24 sm:h-32 object-cover"
                />
              ) : (
                <div className="w-full h-24 sm:h-32 bg-zinc-800 flex items-center justify-center">
                  <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
              <div className="p-2 sm:p-3">
                <h3 className={`font-semibold text-white text-sm sm:text-base ${isExpanded ? '' : 'line-clamp-1'}`}>{hub.name}</h3>
                <p className="text-xs sm:text-sm text-zinc-400">
                  {localizeCountry(hub.country)}, {hub.city}
                </p>
                {hub.description && (
                  <p className={`text-xs text-zinc-300 mt-1 ${isExpanded ? '' : 'line-clamp-1'}`}>{hub.description}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
