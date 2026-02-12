'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Language, getInitialLanguage, getTranslations } from '@/lib/i18n'
import { StandaloneLanguageSwitcher } from '@/components/ui/LanguageSwitcher'

const LANGUAGE_KEY = 'fomus-guild-language'

type PageStatus = 'loading' | 'verifying' | 'sending' | 'sent' | 'error'

export default function PaidPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const code = params.code as string
  const sessionId = searchParams.get('session_id')

  const [status, setStatus] = useState<PageStatus>('loading')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    const lang = getInitialLanguage()
    setLanguageState(lang)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(LANGUAGE_KEY, lang)
  }

  const t = getTranslations(language)

  useEffect(() => {
    if (!sessionId) {
      setError(t.invalidSession)
      setStatus('error')
      return
    }

    async function verifyAndSendMagicLink() {
      setStatus('verifying')

      try {
        // Verify Stripe session
        const verifyRes = await fetch('/api/stripe/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })

        const data = await verifyRes.json()

        if (!verifyRes.ok) {
          throw new Error(data.error || 'Verification failed')
        }

        const { email: customerEmail, inviteCode } = data

        if (!customerEmail) {
          throw new Error(language === 'ja' ? 'メールアドレスが取得できませんでした' : 'Could not retrieve email')
        }

        // Verify invite code matches
        if (inviteCode && inviteCode !== code) {
          throw new Error(language === 'ja' ? '招待コードが一致しません' : 'Invite code mismatch')
        }

        setEmail(customerEmail)

        // Save stripe_session_id to cookie for auth callback
        document.cookie = `stripe_session_id=${sessionId}; path=/; max-age=3600; SameSite=Lax`
        // Also save invite code
        document.cookie = `pending_invite_code=${code}; path=/; max-age=3600; SameSite=Lax`

        // Send magic link
        setStatus('sending')
        const supabase = createClient()

        const { error: authError } = await supabase.auth.signInWithOtp({
          email: customerEmail,
          options: {
            emailRedirectTo: `${window.location.origin}/api/auth/callback?invite_code=${code}`,
            data: {
              invite_code: code,
            },
          },
        })

        if (authError) {
          throw new Error(authError.message)
        }

        setStatus('sent')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setStatus('error')
      }
    }

    verifyAndSendMagicLink()
  }, [sessionId, code, language])

  if (status === 'loading' || status === 'verifying') {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50">
        <div className="absolute top-4 right-4">
          <StandaloneLanguageSwitcher
            language={language}
            onLanguageChange={setLanguage}
            className="text-zinc-600"
          />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-zinc-600">
              {t.verifyingPayment}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'sending') {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50">
        <div className="absolute top-4 right-4">
          <StandaloneLanguageSwitcher
            language={language}
            onLanguageChange={setLanguage}
            className="text-zinc-600"
          />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-zinc-600">
              {t.sendingEmail}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
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
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-4">
              {t.errorOccurred}
            </h1>
            <p className="text-zinc-600 mb-6">{error}</p>
            <Button onClick={() => window.location.href = `/invite/${code}`}>
              {t.returnHome}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Success - sent status
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
          <h1 className="text-2xl font-bold text-zinc-900 mb-4">
            {t.paymentComplete}
          </h1>
          <p className="text-zinc-600 mb-2">
            {t.checkYourEmail}
          </p>
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
