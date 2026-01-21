'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [mode, setMode] = useState<'signin' | 'register'>('signin')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // 管理者メールアドレスの場合は直接ログイン試行
    try {
      const adminLoginRes = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (adminLoginRes.ok) {
        const { redirectUrl } = await adminLoginRes.json()
        // 管理者はメール確認なしで直接リダイレクト
        window.location.href = redirectUrl
        return
      }
    } catch {
      // 管理者ログイン失敗時は通常のOTPフローへ
    }

    // 通常のマジックリンクログイン
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({
        type: 'success',
        text: 'Check your email for the magic link to sign in!',
      })
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">FOMUS GUILD</h1>
          <p className="text-zinc-300">Join the global MASU community</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur rounded-xl border border-zinc-500/30 p-6">
          {/* Tab Buttons */}
          <div className="flex mb-6 bg-zinc-800/50 rounded-lg p-1">
            <button
              type="button"
              onClick={() => { setMode('signin'); setMessage(null) }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'signin'
                  ? 'bg-[#c0c0c0] text-zinc-900'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setMessage(null) }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                mode === 'register'
                  ? 'bg-[#c0c0c0] text-zinc-900'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-white/10 border border-zinc-500/30 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0] focus:border-transparent"
              />
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.type === 'success'
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-[#c0c0c0] text-zinc-900 rounded-lg font-medium hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Sending...
                </>
              ) : mode === 'signin' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-400">
              {mode === 'signin' ? (
                <>
                  We&apos;ll send you a magic link to sign in.
                  <br />
                  No password required.
                </>
              ) : (
                <>
                  We&apos;ll send you a verification email.
                  <br />
                  Click the link to complete registration.
                </>
              )}
            </p>
          </div>

          {/* Free tier notice - only show for register mode */}
          {mode === 'register' && (
            <div className="mt-6 p-4 bg-zinc-800/50 rounded-lg border border-zinc-600/30">
              <h3 className="text-sm font-medium text-white mb-2">Free Registration</h3>
              <p className="text-xs text-zinc-400">
                Anyone can join FOMUS GUILD for free! Free members can view MASU Hub locations on the map. Upgrade to a paid membership to unlock all features including member locations and exclusive offers.
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
