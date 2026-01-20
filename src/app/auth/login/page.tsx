'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/app'
  const hasError = searchParams.get('error')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setStatus('loading')

    // デバッグログイン（AAAAA入力時）
    if (email === 'AAAAA') {
      try {
        const response = await fetch('/api/auth/debug-login', { method: 'POST' })
        const data = await response.json()
        if (data.url) {
          window.location.href = data.url
          return
        }
        setError('Debug login failed')
        setStatus('idle')
        return
      } catch {
        setError('Debug login failed')
        setStatus('idle')
        return
      }
    }

    const supabase = createClient()

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${redirect}`,
      },
    })

    if (authError) {
      setError(authError.message)
      setStatus('idle')
      return
    }

    setStatus('sent')
  }

  if (status === 'sent') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-4">Check Your Email</h1>
          <p className="text-zinc-600 mb-2">
            We&apos;ve sent a magic link to <strong>{email}</strong>
          </p>
          <p className="text-zinc-500 text-sm">
            Click the link in the email to sign in.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">
              FOMUS GUILD
            </h1>
            <p className="text-zinc-600">
              Sign in to your account
            </p>
          </div>

          {hasError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
              Authentication failed. Please try again.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Email Address"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              required
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={status === 'loading'}
            >
              Send Magic Link
            </Button>
          </form>

          <p className="text-xs text-zinc-500 text-center mt-6">
            FOMUS GUILD is invitation-only. If you don&apos;t have an account,
            please contact a member for an invitation.
          </p>
        </div>
      </div>
    </div>
  )
}

function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="animate-spin w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  )
}
