'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

function SubscribeForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [error, setError] = useState('')
  const canceled = searchParams.get('canceled') === 'true'

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // プロフィールを確認
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single()

      // すでにアクティブまたは無料会員なら/appへ
      if (profile?.subscription_status === 'active' || profile?.subscription_status === 'free') {
        router.push('/app')
        return
      }

      setCheckingStatus(false)
    }

    checkSubscriptionStatus()
  }, [router])

  const handleSubscribe = async (isJapan: boolean) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isJapan }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || '決済ページの作成に失敗しました')
        setLoading(false)
      }
    } catch {
      setError('エラーが発生しました')
      setLoading(false)
    }
  }

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
        <div className="animate-spin w-8 h-8 border-2 border-[#c0c0c0] border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur rounded-2xl border border-zinc-500/30 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#c0c0c0]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#c0c0c0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              FOMUS GUILD メンバーシップ
            </h1>
            <p className="text-zinc-400">
              ギルドメンバーとして全機能にアクセスできます
            </p>
          </div>

          {canceled && (
            <div className="mb-6 p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-300 text-sm">
              決済がキャンセルされました。もう一度お試しください。
            </div>
          )}

          {error && (
            <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* 特典一覧 */}
          <div className="mb-8 space-y-3">
            <div className="flex items-center gap-3 text-zinc-300">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>デジタル会員証</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-300">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>ギルドマップでメンバーを閲覧</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-300">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>クエストに参加してポイント獲得</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-300">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>メンバー限定特典・オファー</span>
            </div>
          </div>

          {/* 価格選択 */}
          <div className="space-y-3">
            <Button
              onClick={() => handleSubscribe(true)}
              loading={loading}
              className="w-full py-4 text-lg"
            >
              ¥1,500/月 で登録（日本）
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSubscribe(false)}
              loading={loading}
              className="w-full"
            >
              $10/month（International）
            </Button>
          </div>

          <p className="text-xs text-zinc-500 text-center mt-6">
            いつでもキャンセル可能です。決済はStripeで安全に処理されます。
          </p>
        </div>

        {/* ログアウトリンク */}
        <div className="mt-6 text-center">
          <button
            onClick={async () => {
              const supabase = createClient()
              await supabase.auth.signOut()
              router.push('/')
            }}
            className="text-zinc-400 hover:text-white text-sm transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  )
}

function SubscribeLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      <div className="animate-spin w-8 h-8 border-2 border-[#c0c0c0] border-t-transparent rounded-full" />
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
