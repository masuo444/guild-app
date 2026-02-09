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

// MASU Hubs section header
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
