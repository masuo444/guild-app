'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MembershipType, isFreeMembershipType, MEMBERSHIP_TYPE_LABELS } from '@/types/database'
import { Language, getInitialLanguage, getTranslations } from '@/lib/i18n'
import { StandaloneLanguageSwitcher } from '@/components/ui/LanguageSwitcher'

const LANGUAGE_KEY = 'fomus-guild-language'

type InviteStatus = 'loading' | 'valid' | 'invalid' | 'used' | 'submitting' | 'sent' | 'redirecting'

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = params.code as string
  const canceled = searchParams.get('canceled') === 'true'
  const [status, setStatus] = useState<InviteStatus>('loading')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [membershipType, setMembershipType] = useState<MembershipType>('standard')
  const [isFree, setIsFree] = useState(false)
  const [language, setLanguageState] = useState<Language>('en')
  const [isJapan, setIsJapan] = useState(false)

  useEffect(() => {
    const lang = getInitialLanguage()
    setLanguageState(lang)
    // Detect if user is in Japan based on timezone or language
    const isJapanese = lang === 'ja' || Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Tokyo'
    setIsJapan(isJapanese)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(LANGUAGE_KEY, lang)
  }

  const t = getTranslations(language)

  useEffect(() => {
    const supabase = createClient()

    async function checkInvite() {
      const { data, error } = await supabase
        .from('invites')
        .select('used, membership_type')
        .eq('code', code)
        .single()

      if (error || !data) {
        setStatus('invalid')
        return
      }

      if (data.used) {
        setStatus('used')
        return
      }

      const type = (data.membership_type || 'standard') as MembershipType
      setMembershipType(type)
      setIsFree(isFreeMembershipType(type))
      setStatus('valid')
    }

    checkInvite()
  }, [code])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setStatus('submitting')

    const supabase = createClient()

    // 招待コードをcookieに保存（メールリンクからの戻り時に使用）
    document.cookie = `pending_invite_code=${code}; path=/; max-age=3600; SameSite=Lax`

    // Magic Link を送信
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?invite_code=${code}`,
      },
    })

    if (authError) {
      console.error('Auth error:', authError)
      // より分かりやすいエラーメッセージに変換
      let errorMessage = authError.message
      if (authError.message.includes('Database error')) {
        errorMessage = language === 'ja'
          ? 'サーバーエラーが発生しました。しばらく待ってから再度お試しください。'
          : 'A server error occurred. Please try again in a moment.'
      }
      setError(errorMessage)
      setStatus('valid')
      return
    }

    setStatus('sent')
  }

  const handleProceedToPayment = async () => {
    setError('')
    setStatus('redirecting')

    try {
      const res = await fetch('/api/stripe/guest-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: code, isJapan }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setStatus('valid')
    }
  }

  if (status === 'loading' || status === 'redirecting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full mx-auto mb-4" />
          {status === 'redirecting' && (
            <p className="text-zinc-600">
              {t.redirectingToPayment}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50">
        <div className="absolute top-4 right-4">
          <StandaloneLanguageSwitcher
            language={language}
            onLanguageChange={setLanguage}
            className="text-zinc-600"
          />
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <h1 className="text-2xl font-bold text-zinc-900 mb-4">{t.invalidInvitation}</h1>
            <p className="text-zinc-600 mb-6">
              {t.invalidInvitationDesc}
            </p>
            <Button variant="secondary" onClick={() => router.push('/')}>
              {t.returnHome}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'used') {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50">
        <div className="absolute top-4 right-4">
          <StandaloneLanguageSwitcher
            language={language}
            onLanguageChange={setLanguage}
            className="text-zinc-600"
          />
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <h1 className="text-2xl font-bold text-zinc-900 mb-4">{t.invitationUsed}</h1>
            <p className="text-zinc-600 mb-6">
              {t.invitationUsedDesc}
            </p>
            <Button onClick={() => router.push('/auth/login')}>
              {t.goToLogin}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'sent') {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50">
        <div className="absolute top-4 right-4">
          <StandaloneLanguageSwitcher
            language={language}
            onLanguageChange={setLanguage}
            className="text-zinc-600"
          />
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-4">{t.checkYourEmail}</h1>
            <p className="text-zinc-600 mb-2">
              {t.magicLinkSent} <strong>{email}</strong>
            </p>
            <p className="text-zinc-500 text-sm">
              {t.clickLinkToRegister}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <div className="absolute top-4 right-4">
        <StandaloneLanguageSwitcher
          language={language}
          onLanguageChange={setLanguage}
          className="text-zinc-600"
        />
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-zinc-900 mb-2">
                {t.welcomeToGuild}
              </h1>
              <p className="text-zinc-600">
                {t.youveBeenInvited}
              </p>
              {isFree && (
                <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-medium">
                  {MEMBERSHIP_TYPE_LABELS[membershipType]} {t.freeInvitation.replace('（', '(').replace('）', ')')}
                </div>
              )}
            </div>

            {canceled && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm text-center">
                {t.paymentCanceled}
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm text-center">
                {error}
              </div>
            )}

            {isFree ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  label={t.emailAddress}
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  loading={status === 'submitting'}
                >
                  {t.continueWithEmail}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <Button
                  onClick={handleProceedToPayment}
                  className="w-full"
                  size="lg"
                >
                  {t.proceedToPayment}
                </Button>
              </div>
            )}

            <p className="text-xs text-zinc-500 text-center mt-6">
              {isFree ? t.freeAccess : t.afterVerification}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
