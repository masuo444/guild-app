'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Profile } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { useLanguage } from '@/lib/i18n'

interface OnboardingFormProps {
  profile: Profile
  email: string
}

/**
 * 参加直後の最短オンボーディング。
 * 表示名（メールの@前を初期値）＋任意の国だけ。写真・ピン位置はマイページで後から。
 */
export function OnboardingForm({ profile, email }: OnboardingFormProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [displayName, setDisplayName] = useState(profile.display_name || email.split('@')[0] || '')
  const [country, setCountry] = useState(profile.home_country || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          display_name: displayName.trim(),
          home_country: country.trim() || null,
        }),
      })
      const result = await res.json()
      if (!res.ok || !result.success) {
        setSaving(false)
        setError(result.error || 'Update failed')
        return
      }
      router.push('/app')
      router.refresh()
    } catch {
      setSaving(false)
      setError('Network error')
    }
  }

  return (
    <Card>
      <CardContent className="py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">{t.onboardingTitle}</h1>
          <p className="text-zinc-400 text-sm">{t.onboardingNameHint}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label={`${t.onboardingName} *`}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            autoFocus
          />

          <Input
            label={t.onboardingCountry}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Japan"
          />

          {error && (
            <div className="p-3 rounded-lg text-sm bg-red-500/20 text-red-300 border border-red-500/30">{error}</div>
          )}

          <Button type="submit" loading={saving} disabled={!displayName.trim()} className="w-full">
            {t.onboardingStart}
          </Button>

          <div className="text-center">
            <Link href="/app" className="text-sm text-zinc-400 hover:text-white transition-colors">
              {t.onboardingSkip}
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
