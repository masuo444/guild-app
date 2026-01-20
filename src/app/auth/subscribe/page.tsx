'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

function SubscribeForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const canceled = searchParams.get('canceled')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [isJapan, setIsJapan] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // 日本かどうかを判定（ブラウザの言語設定とタイムゾーン）
    const detectJapan = () => {
      const language = navigator.language || ''
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
      return language.startsWith('ja') || timezone === 'Asia/Tokyo'
    }
    setIsJapan(detectJapan())

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

      // 既にアクティブなら /app へ
      if (profile?.subscription_status === 'active' && profile?.membership_status === 'active') {
        router.push('/app')
        return
      }

      setChecking(false)
    }

    checkStatus()
  }, [router])

  const handleSubscribe = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isJapan }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Subscription error:', error)
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-spin w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {canceled && (
            <div className="bg-amber-50 text-amber-800 p-3 rounded-lg mb-6 text-sm">
              Payment was canceled. You can try again when you&apos;re ready.
            </div>
          )}

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">
              Activate Your Membership
            </h1>
            <p className="text-zinc-600">
              Complete your subscription to unlock all features
            </p>
          </div>

          {/* 料金プラン */}
          <div className="border border-zinc-200 rounded-xl p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-zinc-900">FOMUS GUILD Monthly</h3>
                <p className="text-sm text-zinc-500">Full membership access</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-zinc-900">
                  {isJapan ? '¥980' : '$10'}
                </p>
                <p className="text-xs text-zinc-500">/month</p>
              </div>
            </div>

            <ul className="space-y-2 text-sm text-zinc-600">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Digital Membership Card
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Access to Global Member Map
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                MASU Points &amp; Rank System
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Exclusive Guild Offers
              </li>
            </ul>
          </div>

          <Button
            onClick={handleSubscribe}
            className="w-full"
            size="lg"
            loading={loading}
          >
            Subscribe Now
          </Button>

          <p className="text-xs text-zinc-500 text-center mt-4">
            Secure payment powered by Stripe. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  )
}

function SubscribeLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="animate-spin w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full" />
    </div>
  )
}

export default function SubscribePage() {
  return (
    <Suspense fallback={<SubscribeLoading />}>
      <SubscribeForm />
    </Suspense>
  )
}
