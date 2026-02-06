'use client'

import { useLanguage } from '@/lib/i18n'

export function ProfilePageHeader() {
  const { t } = useLanguage()
  return <h1 className="text-2xl font-bold text-white mb-6">{t.profileSettings}</h1>
}
