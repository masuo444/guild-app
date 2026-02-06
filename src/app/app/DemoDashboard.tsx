'use client'

import Link from 'next/link'
import { useLanguage } from '@/lib/i18n'
import { GuildMemberOnlyOverlay } from '@/components/ui/LocalizedText'

function GuildMemberOnlySection({ titleKey, descKey }: { titleKey: string; descKey: string }) {
  const { t } = useLanguage()
  const title = (t as Record<string, string>)[titleKey] || titleKey
  const description = (t as Record<string, string>)[descKey] || descKey
  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-6 mb-6 relative overflow-hidden border border-zinc-500/30">
      <GuildMemberOnlyOverlay />
      <h2 className="text-xl font-semibold text-zinc-600 mb-4">{title}</h2>
      <p className="text-sm text-zinc-500">{description}</p>
      <div className="h-32 bg-zinc-800/50 rounded-lg mt-4"></div>
    </div>
  )
}

export function DemoDashboard() {
  const { t } = useLanguage()

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* デモモードバナー */}
      <div className="bg-gradient-to-r from-[#c0c0c0]/20 to-[#c0c0c0]/10 border border-[#c0c0c0]/30 rounded-xl px-4 py-3 mb-6">
        <p className="font-medium text-white">{t.fomusGuildPreview}</p>
        <p className="text-sm text-zinc-400">{t.demoModeMapOnly}</p>
      </div>

      <h1 className="text-2xl font-bold text-white mb-6">{t.dashboard}</h1>

      {/* マップへのアクセス（公開） */}
      <Link
        href="/app/map?demo=true"
        className="block bg-gradient-to-r from-orange-500/20 to-orange-500/10 backdrop-blur rounded-xl p-6 mb-6 border border-orange-500/30 hover:border-orange-500/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-7 h-7 text-orange-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white mb-1">{t.guildMap}</h2>
            <p className="text-sm text-zinc-300">{t.viewMasuHubLocations}</p>
          </div>
          <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>

      {/* ギルドメンバー限定セクション */}
      <GuildMemberOnlySection titleKey="membershipCard" descKey="viewDigitalCard" />
      <GuildMemberOnlySection titleKey="masuPoints" descKey="trackPointsProgress" />
      <GuildMemberOnlySection titleKey="offersAndQuests" descKey="accessExclusiveOffers" />
      <GuildMemberOnlySection titleKey="profile" descKey="manageProfileSettings" />

      {/* 参加を促すCTA */}
      <div className="bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-xl p-8 text-center border border-zinc-500/30">
        <h2 className="text-2xl font-bold text-white mb-4">{t.joinFomusGuild}</h2>
        <p className="text-zinc-300 mb-6">{t.joinFomusGuildDesc}</p>
        <Link
          href="/auth/login"
          className="inline-block px-8 py-3 bg-[#c0c0c0] text-zinc-900 font-medium rounded-lg hover:bg-white transition-colors"
        >
          {t.getStarted}
        </Link>
      </div>
    </div>
  )
}
