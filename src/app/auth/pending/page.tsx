'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { useLanguage, LanguageProvider } from '@/lib/i18n'

function PendingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const { t } = useLanguage()
  const [status, setStatus] = useState<'checking' | 'pending' | 'active'>('checking')
  const [attempts, setAttempts] = useState(0)
  const attemptsRef = useRef(0)

  useEffect(() => {
    const supabase = createClient()
    let interval: ReturnType<typeof setInterval> | null = null

    // Stripe session_id がある場合、直接アクティベーションを試行
    async function activateViaSession(): Promise<boolean> {
      if (!sessionId) return false

      try {
        const res = await fetch('/api/stripe/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })

        if (res.ok) {
          const data = await res.json()
          if (data.activated) {
            setStatus('active')
            setTimeout(() => router.push('/app'), 1500)
            return true
          }
        }
      } catch {
        // verify-session失敗時はポーリングにフォールバック
      }
      return false
    }

    async function checkStatus() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, membership_status')
        .eq('id', user.id)
        .single()

      if (profile?.subscription_status === 'active' && profile?.membership_status === 'active') {
        setStatus('active')
        if (interval) clearInterval(interval)
        setTimeout(() => router.push('/app'), 1500)
        return
      }

      setStatus('pending')
      attemptsRef.current += 1
      setAttempts(attemptsRef.current)
    }

    async function init() {
      // まずStripeセッションで直接アクティベーション
      const activated = await activateViaSession()
      if (activated) return

      // 失敗時はWebhook待ちのポーリング
      checkStatus()
      interval = setInterval(() => {
        if (attemptsRef.current < 30) {
          checkStatus()
        } else {
          if (interval) clearInterval(interval)
        }
      }, 2000)
    }

    init()

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [router, sessionId])

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-spin w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (status === 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-600"
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
            {t('pendingWelcome')}
          </h1>
          <p className="text-zinc-600">
            {t('pendingActiveRedirecting')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <div className="animate-spin w-10 h-10 border-3 border-zinc-300 border-t-zinc-900 rounded-full" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 mb-4">
          {t('pendingActivating')}
        </h1>
        <p className="text-zinc-600 mb-6">
          {t('pendingProcessing')}
        </p>

        {attempts > 10 && (
          <div className="bg-amber-50 text-amber-800 p-4 rounded-lg mb-4 text-sm">
            <p className="mb-2">{t('pendingTakingLong')}</p>
            <p>{t('pendingTryRefresh')}</p>
          </div>
        )}

        <Button variant="secondary" onClick={() => window.location.reload()}>
          {t('pendingRefresh')}
        </Button>
      </div>
    </div>
  )
}

export default function PendingPage() {
  return (
    <LanguageProvider>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-zinc-50">
            <div className="animate-spin w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full" />
          </div>
        }
      >
        <PendingContent />
      </Suspense>
    </LanguageProvider>
  )
}
