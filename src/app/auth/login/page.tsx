'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Language, getInitialLanguage } from '@/lib/i18n'
import { StandaloneLanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { MembershipType, MEMBERSHIP_TYPE_LABELS } from '@/types/database'

const LANGUAGE_KEY = 'fomus-guild-language'

type Step = 'email' | 'code'

interface StartResult {
  exists: boolean
  invite: { membershipType: MembershipType; isFree: boolean } | null
}

const COPY = {
  ja: {
    title: 'FOMUS GUILD',
    subtitle: 'メールアドレスだけで、ログインも無料参加もできます',
    email: 'メールアドレス',
    send: '認証コードを送る',
    sending: '送信中…',
    hint: 'はじめての方は自動で無料会員になります。すでに会員の方はそのままログインできます。',
    haveInvite: '招待コードをお持ちの方',
    inviteCode: '招待コード',
    invitePlaceholder: '例: ABC123',
    codeTitle: '認証コードを入力',
    codeSentTo: 'に届いたコードを入力してください',
    codeLabel: '認証コード',
    verify: '確認する',
    verifying: '確認中…',
    changeEmail: 'メールアドレスを変更する',
    resend: 'コードを再送する',
    resent: '再送しました',
    loginHint: 'おかえりなさい。確認するとログインします。',
    registerHint: 'ようこそ。確認すると無料会員として参加します。',
    inviteHint: '招待コードが確認できました。',
    freeInvite: '無料招待',
    backHome: 'トップに戻る',
    errors: {
      invalid_email: 'メールアドレスの形式が正しくありません。',
      rate_limited: 'リクエストが多すぎます。少し時間をおいてからもう一度お試しください。',
      invalid_invite: '招待コードが無効です。コードなしでも無料で参加できます。',
      used_invite: 'この招待コードは使用済みです。コードなしでも無料で参加できます。',
      send_failed: 'コードを送信できませんでした。もう一度お試しください。',
      unavailable: 'サーバーに接続できません。しばらくしてからもう一度お試しください。',
      invalid_code: 'コードが正しくありません。もう一度お試しください。',
      network: 'ネットワークエラーが発生しました。',
      auth: 'ログインに失敗しました。もう一度お試しください。',
    } as Record<string, string>,
  },
  en: {
    title: 'FOMUS GUILD',
    subtitle: 'Log in or join for free with just your email',
    email: 'Email address',
    send: 'Send verification code',
    sending: 'Sending…',
    hint: "New here? You'll join as a free member automatically. Already a member? You'll simply log in.",
    haveInvite: 'Have an invite code?',
    inviteCode: 'Invite code',
    invitePlaceholder: 'e.g. ABC123',
    codeTitle: 'Enter verification code',
    codeSentTo: 'Enter the code we sent to',
    codeLabel: 'Verification code',
    verify: 'Continue',
    verifying: 'Checking…',
    changeEmail: 'Change email address',
    resend: 'Resend code',
    resent: 'Code resent',
    loginHint: "Welcome back. You'll be logged in after verification.",
    registerHint: "Welcome! You'll join as a free member after verification.",
    inviteHint: 'Invite code confirmed.',
    freeInvite: 'Free invite',
    backHome: 'Back to home',
    errors: {
      invalid_email: 'Please enter a valid email address.',
      rate_limited: 'Too many requests. Please wait a moment and try again.',
      invalid_invite: 'Invalid invite code. You can still join for free without one.',
      used_invite: 'This invite code has already been used. You can still join for free without one.',
      send_failed: 'Could not send the code. Please try again.',
      unavailable: 'Cannot reach the server. Please try again later.',
      invalid_code: 'Invalid code. Please try again.',
      network: 'Network error.',
      auth: 'Login failed. Please try again.',
    } as Record<string, string>,
  },
}

function LoginForm() {
  const searchParams = useSearchParams()
  const [language, setLanguageState] = useState<Language>('ja')
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [result, setResult] = useState<StartResult | null>(null)

  const c = COPY[language]

  useEffect(() => {
    setLanguageState(getInitialLanguage())

    // 招待リンク等からのプリフィル・エラー表示
    const invite = searchParams.get('invite')
    if (invite) {
      setInviteCode(invite.toUpperCase())
      setShowInvite(true)
    }
    const err = searchParams.get('error')
    if (err) {
      setError(COPY[getInitialLanguage()].errors[err] || COPY[getInitialLanguage()].errors.auth)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(LANGUAGE_KEY, lang)
  }

  // リダイレクト先（/app 以下のみ許可）
  const redirectPath = (() => {
    const r = searchParams.get('redirect') || ''
    return r.startsWith('/app') ? r : '/app'
  })()

  const start = async (): Promise<boolean> => {
    setLoading(true)
    setError('')
    setNotice('')
    try {
      const res = await fetch('/api/auth/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, inviteCode: showInvite ? inviteCode : '' }),
      })
      const data = await res.json()
      if (!res.ok) {
        const key = data.unavailable ? 'unavailable' : data.error
        setError(c.errors[key] || c.errors.send_failed)
        return false
      }
      setResult({ exists: data.exists, invite: data.invite })
      return true
    } catch {
      setError(c.errors.network)
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (await start()) {
      setCode('')
      setStep('code')
    }
  }

  const handleResend = async () => {
    if (await start()) setNotice(c.resent)
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      })
      if (!res.ok) {
        setError(c.errors.invalid_code)
        setLoading(false)
        return
      }

      // 既存会員 → そのままアプリへ
      if (result?.exists) {
        window.location.href = `/api/auth/callback?next=${encodeURIComponent(redirectPath)}`
        return
      }

      // 招待コード経由の新規 → callback が招待特典・会員種別を処理
      if (result?.invite && showInvite && inviteCode) {
        window.location.href = `/api/auth/callback?invite_code=${encodeURIComponent(inviteCode.toUpperCase())}&next=/app/onboarding`
        return
      }

      // 招待なしの新規 → 無料会員プロフィール作成 → はじめの一歩へ
      try {
        const reg = await fetch('/api/auth/register-free', { method: 'POST' })
        window.location.href = reg.ok ? '/app/onboarding' : '/api/auth/callback?next=/app/onboarding'
      } catch {
        window.location.href = '/api/auth/callback?next=/app/onboarding'
      }
    } catch {
      setError(c.errors.network)
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-4 py-3 bg-white/10 border border-zinc-500/30 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0] focus:border-transparent'
  const buttonClass =
    'w-full px-4 py-3.5 bg-[#c0c0c0] text-zinc-900 rounded-lg font-medium hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <StandaloneLanguageSwitcher language={language} onLanguageChange={setLanguage} />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{c.title}</h1>
          <p className="text-zinc-300 text-sm">{c.subtitle}</p>
        </div>

        <div className="bg-white/10 backdrop-blur rounded-xl border border-zinc-500/30 p-6">
          {step === 'email' && (
            <form onSubmit={handleStart} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1">
                  {c.email}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className={inputClass}
                  autoFocus
                />
              </div>

              {/* 招待コード（任意・折りたたみ） */}
              {showInvite ? (
                <div>
                  <label htmlFor="invite" className="block text-sm font-medium text-zinc-300 mb-1">
                    {c.inviteCode}
                  </label>
                  <input
                    id="invite"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder={c.invitePlaceholder}
                    maxLength={8}
                    className={`${inputClass} font-mono tracking-wider`}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowInvite(true)}
                  className="text-xs text-zinc-400 hover:text-white underline underline-offset-2 transition-colors"
                >
                  {c.haveInvite}
                </button>
              )}

              {error && (
                <div className="p-3 rounded-lg text-sm bg-red-500/20 text-red-300 border border-red-500/30">{error}</div>
              )}

              <button type="submit" disabled={loading} className={buttonClass}>
                {loading ? c.sending : c.send}
              </button>

              <p className="text-xs text-zinc-500 text-center leading-relaxed">{c.hint}</p>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="text-xl font-medium text-white mb-2">{c.codeTitle}</h2>
                <p className="text-sm text-zinc-400">
                  {language === 'ja' ? (
                    <><strong className="text-white">{email}</strong> {c.codeSentTo}</>
                  ) : (
                    <>{c.codeSentTo} <strong className="text-white">{email}</strong></>
                  )}
                </p>
                <p className="text-xs text-zinc-500 mt-2">
                  {result?.exists ? c.loginHint : c.registerHint}
                </p>
                {result?.invite && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-medium mt-2">
                    {c.inviteHint}
                    {result.invite.isFree && (
                      <span>· {MEMBERSHIP_TYPE_LABELS[result.invite.membershipType]} {c.freeInvite}</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="code" className="block text-sm font-medium text-zinc-300 mb-1">
                  {c.codeLabel}
                </label>
                <input
                  id="code"
                  type="text"
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="••••••••"
                  maxLength={8}
                  className={`${inputClass} font-mono text-center text-2xl tracking-[0.4em]`}
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg text-sm bg-red-500/20 text-red-300 border border-red-500/30">{error}</div>
              )}
              {notice && (
                <div className="p-3 rounded-lg text-sm bg-green-500/20 text-green-300 border border-green-500/30">{notice}</div>
              )}

              <button type="submit" disabled={loading || code.length < 6} className={buttonClass}>
                {loading ? c.verifying : c.verify}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => { setStep('email'); setCode(''); setError(''); setNotice('') }}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  {c.changeEmail}
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  {c.resend}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-zinc-400 hover:text-white text-sm transition-colors">
            {c.backHome}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border border-zinc-600 border-t-white rounded-full" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
