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

type InviteStatus = 'loading' | 'valid' | 'invalid' | 'used' | 'submitting' | 'sent' | 'verifying' | 'redirecting'

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = params.code as string
  const canceled = searchParams.get('canceled') === 'true'
  const [status, setStatus] = useState<InviteStatus>('loading')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [otpCode, setOtpCode] = useState('')
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
        .select('used, membership_type, reusable, use_count')
        .eq('code', code)
        .single()

      if (error || !data) {
        setStatus('invalid')
        return
      }

      // reusable の場合は use_count < 10 で判定
      const isValid = data.reusable ? (data.use_count || 0) < 10 : !data.used
      if (!isValid) {
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

  // レート制限時のフォールバック: サーバー側で直接登録＋ログイン
  const handleDirectRegister = async () => {
    setStatus('redirecting')
    try {
      const res = await fetch('/api/auth/invite-direct-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, inviteCode: code }),
      })

      const result = await res.json()

      if (!res.ok || !result.callbackUrl) {
        setError(t.serverError)
        setStatus('valid')
        return
      }

      window.location.href = result.callbackUrl
    } catch {
      setError(t.serverError)
      setStatus('valid')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (isFree) {
      // 無料招待: OTP不要。サーバー側で直接登録→即ログイン
      await handleDirectRegister()
      return
    }

    // 有料招待: OTP認証フロー
    setStatus('submitting')

    const supabase = createClient()

    document.cookie = `pending_invite_code=${code}; path=/; max-age=3600; SameSite=Lax`

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?invite_code=${code}`,
        data: {
          invite_code: code,
        },
      },
    })

    if (authError) {
      console.error('Auth error:', authError)
      setError(authError.message)
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

  // OTPコード検証
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setStatus('verifying')

    const supabase = createClient()

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'email',
    })

    if (verifyError || !data.user) {
      setError(t.invalidCodeRetry)
      setStatus('sent')
      return
    }

    // OTP検証成功 → quick-register でプロフィール作成 & magic link token 取得
    setStatus('redirecting')

    try {
      const res = await fetch('/api/auth/quick-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.user.id,
          email,
          inviteCode: code,
        }),
      })

      const result = await res.json()

      if (!res.ok || !result.callbackUrl) {
        // quick-register 失敗時は従来のフローにフォールバック
        window.location.href = `/api/auth/callback?invite_code=${code}&next=/app`
        return
      }

      // callback に token_hash 付きでリダイレクト → サーバー側で確実にセッション確立
      window.location.href = result.callbackUrl
    } catch {
      // ネットワークエラー時は従来のフローにフォールバック
      window.location.href = `/api/auth/callback?invite_code=${code}&next=/app`
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

  if (status === 'sent' || status === 'verifying') {
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
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-zinc-900 mb-2">
                  {t.enterVerificationCode}
                </h1>
                <p className="text-zinc-600 text-sm">
                  <strong>{email}</strong> {t.codeSentTo}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label htmlFor="otp-code" className="block text-sm font-medium text-zinc-700 mb-1">
                    {t.verificationCode}
                  </label>
                  <input
                    id="otp-code"
                    type="text"
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="00000000"
                    className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent font-mono text-center text-2xl tracking-[0.3em]"
                    maxLength={8}
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  loading={status === 'verifying'}
                  disabled={otpCode.length !== 6 && otpCode.length !== 8}
                >
                  {t.verifyAndRegister}
                </Button>
              </form>

              <button
                type="button"
                onClick={() => { setStatus('valid'); setOtpCode(''); setError(''); }}
                className="w-full mt-4 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
              >
                {t.changeEmail}
              </button>
            </div>
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
                <div>
                  <label htmlFor="invite-email" className="block text-sm font-medium text-zinc-700 mb-1">
                    {t.emailAddress}
                  </label>
                  <input
                    id="invite-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-white border border-zinc-300 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                  />
                </div>

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
