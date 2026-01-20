'use client'

import { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function SubscribeForm() {
  const router = useRouter()

  // Stripe決済は一時的にスキップ → 直接 /app へリダイレクト
  useEffect(() => {
    const supabase = createClient()

    async function checkAndRedirect() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // 認証済みなら直接 /app へ
      router.push('/app')
    }

    checkAndRedirect()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="animate-spin w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full" />
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
