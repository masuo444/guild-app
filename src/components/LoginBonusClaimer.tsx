'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/i18n'

/**
 * 会員が /app を開いたら1日1回ログインボーナスを付与する（既存の /api/login-bonus を利用）。
 * 付与できた日だけ小さなトーストを出す。同じ日の再リクエストは sessionStorage で抑止。
 */
export function LoginBonusClaimer() {
  const { language } = useLanguage()
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const key = `fomus-login-bonus-${today}`
    try { if (sessionStorage.getItem(key)) return } catch {}
    fetch('/api/login-bonus', { method: 'POST' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        try { sessionStorage.setItem(key, '1') } catch {}
        if (!d?.dailyBonus) return
        const ja = language === 'ja'
        const parts = [ja ? '+10 ログインボーナス' : '+10 Login bonus']
        if (d.streakBonus === 7) parts.push(ja ? '+50 7日連続！' : '+50 7-day streak!')
        if (d.streakBonus === 30) parts.push(ja ? '+150 30日連続！' : '+150 30-day streak!')
        setToast(parts.join('　'))
        setTimeout(() => setToast(null), 4500)
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!toast) return null
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-full bg-amber-500/90 text-zinc-900 text-sm font-semibold shadow-lg">
      🎁 {toast}
    </div>
  )
}
