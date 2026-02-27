'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { MembershipType, isFreeMembershipType, MEMBERSHIP_TYPE_LABELS } from '@/types/database'
import { Language, getInitialLanguage, getTranslations } from '@/lib/i18n'
import { StandaloneLanguageSwitcher } from '@/components/ui/LanguageSwitcher'

const LANGUAGE_KEY = 'fomus-guild-language'

type Mode = 'login' | 'register'
type RegisterStep = 'invite' | 'email' | 'code'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('register')
  const [registerStep, setRegisterStep] = useState<RegisterStep>('invite')
  const [language, setLanguageState] = useState<Language>('en')

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginMessage, setLoginMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loginStep, setLoginStep] = useState<'email' | 'code'>('email')
  const [loginCode, setLoginCode] = useState('')

  // Register state
  const [inviteCode, setInviteCode] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [validatedInvite, setValidatedInvite] = useState<{
    code: string
    membershipType: MembershipType
    isFree: boolean
  } | null>(null)
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState('')
  const [registerCode, setRegisterCode] = useState('')

  const supabase = createClient()

  useEffect(() => {
    const lang = getInitialLanguage()
    setLanguageState(lang)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(LANGUAGE_KEY, lang)
  }

  const t = getTranslations(language)

  // 直接ログイン（レート制限回避用）
  const handleDirectLogin = async () => {
    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        setLoginMessage({ type: 'error', text: data.error || 'Login failed' })
        setLoginLoading(false)
        return
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
      }
    } catch {
      setLoginMessage({ type: 'error', text: 'Network error' })
      setLoginLoading(false)
    }
  }

  // 既存ユーザーログイン - OTPコード送信
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginMessage(null)

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail }),
      })

      const data = await response.json()

      if (!response.ok) {
        setLoginMessage({ type: 'error', text: data.error || 'Failed to send code' })
        setLoginLoading(false)
        return
      }

      // レート制限の場合は直接ログイン
      if (data.rateLimited) {
        setLoginMessage({ type: 'success', text: t.loggingIn })
        await handleDirectLogin()
        return
      }

      setLoginStep('code')
      setLoginMessage({
        type: 'success',
        text: t.codeSentSuccess,
      })
    } catch {
      setLoginMessage({ type: 'error', text: 'Network error' })
    } finally {
      setLoginLoading(false)
    }
  }

  // OTPコード検証
  const handleVerifyLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginMessage(null)

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, otp: loginCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        setLoginMessage({ type: 'error', text: data.error || t.invalidCodeError })
        setLoginLoading(false)
        return
      }

      // ログイン成功 - callbackを経由してプロフィール確認後/appにリダイレクト
      window.location.href = '/api/auth/callback?next=/app'
    } catch {
      setLoginMessage({ type: 'error', text: 'Network error' })
      setLoginLoading(false)
    }
  }

  // 招待コード確認
  const handleCheckInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteLoading(true)
    setInviteError('')

    const { data, error } = await supabase
      .from('invites')
      .select('code, used, membership_type, reusable, use_count')
      .eq('code', inviteCode.toUpperCase().trim())
      .single()

    if (error || !data) {
      setInviteError(t.invalidCode)
      setInviteLoading(false)
      return
    }

    if (data.reusable ? (data.use_count || 0) >= 10 : data.used) {
      setInviteError(t.codeAlreadyUsed)
      setInviteLoading(false)
      return
    }

    const membershipType = (data.membership_type || 'standard') as MembershipType
    setValidatedInvite({
      code: data.code,
      membershipType,
      isFree: isFreeMembershipType(membershipType),
    })
    setRegisterStep('email')
    setInviteLoading(false)
  }

  // 新規登録 - OTPコード送信
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validatedInvite) return

    setRegisterLoading(true)
    setRegisterError('')

    const { error } = await supabase.auth.signInWithOtp({
      email: registerEmail,
      options: {
        data: {
          invite_code: validatedInvite.code,
        },
      },
    })

    if (error) {
      setRegisterError(error.message)
      setRegisterLoading(false)
      return
    }

    setRegisterStep('code')
    setRegisterLoading(false)
  }

  // 新規登録 - OTPコード検証
  const handleVerifyRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validatedInvite) return

    setRegisterLoading(true)
    setRegisterError('')

    const { data, error } = await supabase.auth.verifyOtp({
      email: registerEmail,
      token: registerCode,
      type: 'email',
    })

    if (error) {
      setRegisterError(t.invalidCodeRetry)
      setRegisterLoading(false)
      return
    }

    // 認証成功 - callbackを経由してプロフィール設定
    // callbackルートがinvite_codeを処理してmembership_type, show_location_on_mapを正しく設定する
    const callbackUrl = `/api/auth/callback?invite_code=${encodeURIComponent(validatedInvite.code)}&next=${validatedInvite.isFree ? '/app' : '/auth/subscribe'}`
    window.location.href = callbackUrl
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4">
        <StandaloneLanguageSwitcher
          language={language}
          onLanguageChange={setLanguage}
        />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t.loginTitle}</h1>
          <p className="text-zinc-300">{t.loginSubtitle}</p>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6">
          <button
            onClick={() => { setMode('register'); setRegisterStep('invite'); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'register'
                ? 'bg-[#c0c0c0] text-zinc-900'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t.newRegistration}
          </button>
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'login'
                ? 'bg-[#c0c0c0] text-zinc-900'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t.login}
          </button>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur rounded-xl border border-zinc-500/30 p-6">

          {/* 既存ユーザーログイン - メールアドレス入力 */}
          {mode === 'login' && loginStep === 'email' && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-medium text-white mb-2">{t.existingMemberLogin}</h2>
                <p className="text-sm text-zinc-400">
                  {t.enterRegisteredEmail}
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="block text-sm font-medium text-zinc-300 mb-1">
                    {t.emailAddress}
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-white/10 border border-zinc-500/30 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0] focus:border-transparent"
                  />
                </div>

                {loginMessage && (
                  <div
                    className={`p-3 rounded-lg text-sm ${
                      loginMessage.type === 'success'
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {loginMessage.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full px-4 py-3 bg-[#c0c0c0] text-zinc-900 rounded-lg font-medium hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loginLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t.sending}
                    </>
                  ) : (
                    t.login
                  )}
                </button>
              </form>
            </>
          )}

          {/* 既存ユーザーログイン - 認証コード入力 */}
          {mode === 'login' && loginStep === 'code' && (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-medium text-white mb-2">{t.enterVerificationCode}</h2>
                <p className="text-sm text-zinc-400">
                  <strong className="text-white">{loginEmail}</strong> {t.codeSentTo}
                </p>
              </div>

              <form onSubmit={handleVerifyLogin} className="space-y-4">
                <div>
                  <label htmlFor="login-code" className="block text-sm font-medium text-zinc-300 mb-1">
                    {t.verificationCode}
                  </label>
                  <input
                    id="login-code"
                    type="text"
                    required
                    value={loginCode}
                    onChange={(e) => setLoginCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="00000000"
                    className="w-full px-4 py-3 bg-white/10 border border-zinc-500/30 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0] focus:border-transparent font-mono text-center text-2xl tracking-[0.5em]"
                    maxLength={8}
                    autoFocus
                  />
                </div>

                {loginMessage && (
                  <div
                    className={`p-3 rounded-lg text-sm ${
                      loginMessage.type === 'success'
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {loginMessage.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginLoading || loginCode.length !== 8}
                  className="w-full px-4 py-3 bg-[#c0c0c0] text-zinc-900 rounded-lg font-medium hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loginLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t.checking}
                    </>
                  ) : (
                    t.verifyAndLogin
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setLoginStep('email'); setLoginCode(''); setLoginMessage(null); }}
                  className="w-full text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  {t.changeEmail}
                </button>
              </form>
            </>
          )}

          {/* 新規登録 - ステップ1: 招待コード */}
          {mode === 'register' && registerStep === 'invite' && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-medium text-white mb-2">{t.enterInviteCode}</h2>
                <p className="text-sm text-zinc-400">
                  {t.noInviteCode}
                </p>
              </div>

              <form onSubmit={handleCheckInvite} className="space-y-4">
                <div>
                  <label htmlFor="invite-code" className="block text-sm font-medium text-zinc-300 mb-1">
                    {t.inviteCode}
                  </label>
                  <input
                    id="invite-code"
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder={t.inviteCodePlaceholder}
                    className="w-full px-4 py-3 bg-white/10 border border-zinc-500/30 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0] focus:border-transparent font-mono text-center text-lg tracking-wider"
                    maxLength={8}
                  />
                </div>

                {inviteError && (
                  <div className="p-3 rounded-lg text-sm bg-red-500/20 text-red-300 border border-red-500/30">
                    {inviteError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={inviteLoading || inviteCode.length < 6}
                  className="w-full px-4 py-3 bg-[#c0c0c0] text-zinc-900 rounded-lg font-medium hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {inviteLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t.checking}
                    </>
                  ) : (
                    t.next
                  )}
                </button>
              </form>
            </>
          )}

          {/* 新規登録 - ステップ2: メールアドレス */}
          {mode === 'register' && registerStep === 'email' && validatedInvite && (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-medium text-white mb-2">{t.inviteConfirmed}</h2>
                {validatedInvite.isFree && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-sm font-medium mt-2">
                    {MEMBERSHIP_TYPE_LABELS[validatedInvite.membershipType]} {t.freeInvite}
                  </div>
                )}
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label htmlFor="register-email" className="block text-sm font-medium text-zinc-300 mb-1">
                    {t.emailAddress}
                  </label>
                  <input
                    id="register-email"
                    type="email"
                    required
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-white/10 border border-zinc-500/30 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0] focus:border-transparent"
                  />
                </div>

                {registerError && (
                  <div className="p-3 rounded-lg text-sm bg-red-500/20 text-red-300 border border-red-500/30">
                    {registerError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={registerLoading}
                  className="w-full px-4 py-3 bg-[#c0c0c0] text-zinc-900 rounded-lg font-medium hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {registerLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t.sending}
                    </>
                  ) : (
                    t.sendVerificationCode
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setRegisterStep('invite'); setValidatedInvite(null); }}
                  className="w-full text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  {t.changeInviteCode}
                </button>
              </form>

              <p className="text-xs text-zinc-500 text-center mt-4">
                {validatedInvite.isFree ? t.freeJoinGuild : t.paidJoinGuild}
              </p>
            </>
          )}

          {/* 新規登録 - ステップ3: 認証コード入力 */}
          {mode === 'register' && registerStep === 'code' && (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-medium text-white mb-2">{t.enterVerificationCode}</h2>
                <p className="text-sm text-zinc-400">
                  <strong className="text-white">{registerEmail}</strong> {t.codeSentTo}
                </p>
              </div>

              <form onSubmit={handleVerifyRegister} className="space-y-4">
                <div>
                  <label htmlFor="register-code" className="block text-sm font-medium text-zinc-300 mb-1">
                    {t.verificationCode}
                  </label>
                  <input
                    id="register-code"
                    type="text"
                    required
                    value={registerCode}
                    onChange={(e) => setRegisterCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="00000000"
                    className="w-full px-4 py-3 bg-white/10 border border-zinc-500/30 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0] focus:border-transparent font-mono text-center text-2xl tracking-[0.5em]"
                    maxLength={8}
                    autoFocus
                  />
                </div>

                {registerError && (
                  <div className="p-3 rounded-lg text-sm bg-red-500/20 text-red-300 border border-red-500/30">
                    {registerError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={registerLoading || registerCode.length !== 8}
                  className="w-full px-4 py-3 bg-[#c0c0c0] text-zinc-900 rounded-lg font-medium hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {registerLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t.checking}
                    </>
                  ) : (
                    t.register
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setRegisterStep('email'); setRegisterCode(''); setRegisterError(''); }}
                  className="w-full text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  {t.changeEmail}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-zinc-400 hover:text-white text-sm transition-colors">
            {t.backToHome}
          </Link>
        </div>
      </div>
    </div>
  )
}
