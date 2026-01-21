'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { MembershipType, isFreeMembershipType, MEMBERSHIP_TYPE_LABELS } from '@/types/database'

type Mode = 'login' | 'register'
type RegisterStep = 'invite' | 'email' | 'sent'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('register')
  const [registerStep, setRegisterStep] = useState<RegisterStep>('invite')

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginMessage, setLoginMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

  const supabase = createClient()

  // 既存ユーザーログイン
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginMessage(null)

    const { error } = await supabase.auth.signInWithOtp({
      email: loginEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      setLoginMessage({ type: 'error', text: error.message })
      setLoginLoading(false)
      return
    }

    setLoginMessage({
      type: 'success',
      text: 'ログインリンクをメールで送信しました。メールをご確認ください。',
    })
    setLoginLoading(false)
  }

  // 招待コード確認
  const handleCheckInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteLoading(true)
    setInviteError('')

    const { data, error } = await supabase
      .from('invites')
      .select('code, used, membership_type')
      .eq('code', inviteCode.toUpperCase().trim())
      .single()

    if (error || !data) {
      setInviteError('この招待コードは無効です')
      setInviteLoading(false)
      return
    }

    if (data.used) {
      setInviteError('この招待コードは既に使用されています')
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

  // 新規登録
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validatedInvite) return

    setRegisterLoading(true)
    setRegisterError('')

    const { error } = await supabase.auth.signInWithOtp({
      email: registerEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?invite_code=${validatedInvite.code}`,
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

    setRegisterStep('sent')
    setRegisterLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">FOMUS GUILD</h1>
          <p className="text-zinc-300">Join the global MASU community</p>
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
            新規登録
          </button>
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'login'
                ? 'bg-[#c0c0c0] text-zinc-900'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            ログイン
          </button>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur rounded-xl border border-zinc-500/30 p-6">

          {/* 既存ユーザーログイン */}
          {mode === 'login' && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-medium text-white mb-2">既存メンバーログイン</h2>
                <p className="text-sm text-zinc-400">
                  登録済みのメールアドレスを入力してください
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="block text-sm font-medium text-zinc-300 mb-1">
                    メールアドレス
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
                      送信中...
                    </>
                  ) : (
                    'ログインリンクを送信'
                  )}
                </button>
              </form>
            </>
          )}

          {/* 新規登録 - ステップ1: 招待コード */}
          {mode === 'register' && registerStep === 'invite' && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-medium text-white mb-2">招待コードを入力</h2>
                <p className="text-sm text-zinc-400">
                  招待コードがない場合は、既存メンバーから招待を受けてください
                </p>
              </div>

              <form onSubmit={handleCheckInvite} className="space-y-4">
                <div>
                  <label htmlFor="invite-code" className="block text-sm font-medium text-zinc-300 mb-1">
                    招待コード
                  </label>
                  <input
                    id="invite-code"
                    type="text"
                    required
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="例: ABC12345"
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
                      確認中...
                    </>
                  ) : (
                    '次へ'
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
                <h2 className="text-xl font-medium text-white mb-2">招待コード確認完了</h2>
                {validatedInvite.isFree && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-sm font-medium mt-2">
                    {MEMBERSHIP_TYPE_LABELS[validatedInvite.membershipType]} (無料招待)
                  </div>
                )}
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label htmlFor="register-email" className="block text-sm font-medium text-zinc-300 mb-1">
                    メールアドレス
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
                      送信中...
                    </>
                  ) : (
                    '登録リンクを送信'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setRegisterStep('invite'); setValidatedInvite(null); }}
                  className="w-full text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  ← 招待コードを変更
                </button>
              </form>

              <p className="text-xs text-zinc-500 text-center mt-4">
                {validatedInvite.isFree ? (
                  <>無料でFOMUS GUILDに参加できます</>
                ) : (
                  <>メール確認後、$10/月のサブスクリプションで参加できます</>
                )}
              </p>
            </>
          )}

          {/* 新規登録 - ステップ3: 送信完了 */}
          {mode === 'register' && registerStep === 'sent' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-medium text-white mb-2">メールを確認してください</h2>
              <p className="text-zinc-400 text-sm mb-2">
                <strong className="text-white">{registerEmail}</strong> に登録リンクを送信しました
              </p>
              <p className="text-zinc-500 text-xs">
                メールのリンクをクリックして登録を完了してください
              </p>
            </div>
          )}
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-zinc-400 hover:text-white text-sm transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
