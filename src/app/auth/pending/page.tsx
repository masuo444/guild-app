'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

export default function PendingPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'pending' | 'active'>('checking')
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    let interval: NodeJS.Timeout

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
        clearInterval(interval)
        // 少し待ってからリダイレクト
        setTimeout(() => router.push('/app'), 1500)
        return
      }

      setStatus('pending')
      setAttempts((prev) => prev + 1)
    }

    checkStatus()

    // 2秒ごとにステータスをチェック（最大30回 = 1分）
    interval = setInterval(() => {
      if (attempts < 30) {
        checkStatus()
      } else {
        clearInterval(interval)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [router, attempts])

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
            Welcome to FOMUS GUILD!
          </h1>
          <p className="text-zinc-600">
            Your membership is now active. Redirecting to your dashboard...
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
          Activating Your Membership
        </h1>
        <p className="text-zinc-600 mb-6">
          We&apos;re processing your payment. This usually takes just a few seconds...
        </p>

        {attempts > 10 && (
          <div className="bg-amber-50 text-amber-800 p-4 rounded-lg mb-4 text-sm">
            <p className="mb-2">Taking longer than expected?</p>
            <p>
              If this persists, please refresh the page or contact support.
            </p>
          </div>
        )}

        <Button variant="secondary" onClick={() => window.location.reload()}>
          Refresh Status
        </Button>
      </div>
    </div>
  )
}
