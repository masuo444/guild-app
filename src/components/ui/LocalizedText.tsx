'use client'

import Link from 'next/link'
import { useLanguage } from '@/lib/i18n'

// Reusable "Guild Member Only" overlay for server-rendered pages
export function GuildMemberOnlyOverlay() {
  const { t } = useLanguage()
  return (
    <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
      <div className="text-center p-6">
        <svg className="w-12 h-12 mx-auto mb-3 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-lg font-medium text-white mb-2">{t.guildMemberOnly}</p>
        <p className="text-sm text-zinc-400 mb-4">{t.guildMemberOnlyDesc}</p>
        <Link
          href="/auth/login"
          className="inline-block px-6 py-2 bg-[#c0c0c0] text-zinc-900 rounded-lg font-medium hover:bg-white transition-colors"
        >
          {t.joinGuild}
        </Link>
      </div>
    </div>
  )
}

// Full page "Guild Member Only" for server-rendered pages
export function GuildMemberOnlyPage({ titleKey }: { titleKey: string }) {
  const { t } = useLanguage()
  const title = (t as Record<string, string>)[titleKey] || titleKey
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">{title}</h1>
      <div className="bg-white/10 backdrop-blur rounded-xl p-8 border border-zinc-500/30 text-center">
        <svg className="w-16 h-16 mx-auto mb-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h2 className="text-xl font-semibold text-white mb-2">{t.guildMemberOnly}</h2>
        <p className="text-zinc-400 mb-6">{t.guildMemberOnlyDesc}</p>
        <Link
          href="/auth/login"
          className="inline-block px-8 py-3 bg-[#c0c0c0] text-zinc-900 font-medium rounded-lg hover:bg-white transition-colors"
        >
          {t.joinGuild}
        </Link>
      </div>
    </div>
  )
}

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

// Map demo mode banner
export function MapDemoBanner() {
  const { t } = useLanguage()
  return (
    <div className="mb-6 bg-gradient-to-r from-[#c0c0c0]/20 to-[#c0c0c0]/10 rounded-xl p-4 border border-[#c0c0c0]/30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#c0c0c0]/20 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-[#c0c0c0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-white">{t.demoMode}</h3>
          <p className="text-xs text-zinc-400">{t.demoModeDesc}</p>
        </div>
        <Link
          href="/auth/login"
          className="px-4 py-2 bg-[#c0c0c0] text-zinc-900 rounded-lg text-sm font-medium hover:bg-white transition-colors flex-shrink-0"
        >
          {t.joinGuild}
        </Link>
      </div>
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
