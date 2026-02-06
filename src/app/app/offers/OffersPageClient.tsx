'use client'

import { useLanguage } from '@/lib/i18n'
import { UpgradeBanner } from '@/components/ui/UpgradeBanner'

export function OffersPageHeader() {
  const { t } = useLanguage()
  return (
    <>
      <h1 className="text-2xl font-bold text-white mb-2">{t.offersTitle}</h1>
      <p className="text-zinc-300 mb-6">{t.memberOffersAndQuests}</p>
    </>
  )
}

export function OffersUpgradeView() {
  const { t } = useLanguage()
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">{t.offersTitle}</h1>
      <p className="text-zinc-300 mb-6">{t.memberOffersAndQuests}</p>
      <UpgradeBanner
        title={t.upgradeForOffers}
        description={t.upgradeForOffersDesc}
        buttonText={t.upgrade}
        fullScreen
      />
    </div>
  )
}
