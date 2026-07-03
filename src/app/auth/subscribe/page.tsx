'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Language, getInitialLanguage, getTranslations } from '@/lib/i18n'
import { StandaloneLanguageSwitcher } from '@/components/ui/LanguageSwitcher'

const LANGUAGE_KEY = 'fomus-guild-language'

function SubscribeForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isJapan, setIsJapan] = useState<boolean | null>(null)
  const [language, setLanguageState] = useState<Language>('en')
  const canceled = searchParams.get('canceled') === 'true'

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
    const checkAndRedirect = async () => {
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

      // キャンセルから戻ってきた場合は選択画面を表示
      if (canceled) {
        // 日本判定
        const detectedJapan = detectJapan()
        setIsJapan(detectedJapan)
        setLoading(false)
        return
      }

      // 日本かどうか自動判定し、プラン選択画面を表示（自動決済はしない）
      const detectedJapan = detectJapan()
      setIsJapan(detectedJapan)
      setLoading(false)
    }

    checkAndRedirect()
  }, [router, canceled])

  // 日本判定（言語・タイムゾーン）
  const detectJapan = (): boolean => {
    // ブラウザ言語をチェック
    const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || ''
    if (browserLang.startsWith('ja')) {
      return true
    }

    // タイムゾーンをチェック
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (timeZone === 'Asia/Tokyo') {
        return true
      }
    } catch {
      // タイムゾーン取得失敗
    }

    return false
  }

  const startCheckout = async (japan: boolean, plan: 'monthly' | 'annual' | 'masu' = 'monthly') => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isJapan: japan, plan }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || (language === 'ja' ? '決済ページの作成に失敗しました' : 'Failed to create checkout session'))
        setLoading(false)
      }
    } catch {
      setError(language === 'ja' ? 'エラーが発生しました' : 'An error occurred')
      setLoading(false)
    }
  }

  // ローディング中
  if (loading && !canceled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-4">
        <div className="animate-spin w-8 h-8 border-2 border-[#c0c0c0] border-t-transparent rounded-full mb-4" />
        <p className="text-zinc-400 text-sm">{t.redirectingToPayment}</p>
      </div>
    )
  }

  // キャンセル後 or エラー時の画面
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4">
        <StandaloneLanguageSwitcher
          language={language}
          onLanguageChange={setLanguage}
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/10 backdrop-blur rounded-2xl border border-zinc-500/30 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#c0c0c0]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#c0c0c0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {t.membershipTitle}
              </h1>
              <p className="text-zinc-400">
                {t.membershipDesc}
              </p>
            </div>

            {canceled && (
              <div className="mb-6 p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-300 text-sm">
                {t.paymentCanceled}
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
                <span>{t.benefit1}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{t.benefit2}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{t.benefit3}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{t.benefit4}</span>
              </div>
            </div>

            {/* プラン選択 */}
            {(() => {
              const ja = language === 'ja'
              const jp = isJapan ?? false
              return (
                <div className="space-y-3">
                  {/* 月額 */}
                  <button
                    onClick={() => startCheckout(jp, 'monthly')}
                    disabled={loading}
                    className="w-full text-left rounded-xl border border-zinc-500/40 bg-white/5 p-4 hover:border-[#c0c0c0]/60 transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="text-white font-semibold">{ja ? '月額プラン' : 'Monthly'}</span>
                      <span className="text-white font-bold">{jp ? '¥980' : '$10'}<span className="text-xs text-zinc-400 font-normal">{ja ? '/月' : '/mo'}</span></span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">{ja ? 'いつでも解約できます' : 'Cancel anytime'}</p>
                  </button>

                  {/* 年額 */}
                  <button
                    onClick={() => startCheckout(jp, 'annual')}
                    disabled={loading}
                    className="w-full text-left rounded-xl border border-[#c0c0c0]/50 bg-gradient-to-br from-[#c0c0c0]/10 to-transparent p-4 hover:border-[#c0c0c0] transition-colors disabled:opacity-50 relative"
                  >
                    <span className="absolute -top-2 right-3 px-2 py-0.5 bg-[#c0c0c0] text-zinc-900 text-[10px] font-bold rounded-full">
                      {ja ? '2ヶ月分お得' : '2 months free'}
                    </span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-white font-semibold">{ja ? '年額プラン' : 'Annual'}</span>
                      <span className="text-white font-bold">{jp ? '¥9,800' : '$100'}<span className="text-xs text-zinc-400 font-normal">{ja ? '/年' : '/yr'}</span></span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">{ja ? '月額より約17%お得' : 'Save ~17% vs monthly'}</p>
                  </button>

                  {/* 枡セットプラン（日本国内のみ） */}
                  {jp && (
                    <button
                      onClick={() => startCheckout(jp, 'masu')}
                      disabled={loading}
                      className="w-full text-left rounded-xl border border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-transparent p-4 hover:border-amber-400 transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-baseline justify-between">
                        <span className="text-white font-semibold">🎁 {ja ? '枡セット付き（年額）' : 'Annual + Masu Set'}</span>
                        <span className="text-amber-300 font-bold text-sm">{ja ? '詳細へ' : 'See price'}</span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        {ja ? '年額会員＋入会特典で枡セットを発送（日本国内）' : 'Annual membership + a Masu set shipped to you (Japan only)'}
                      </p>
                    </button>
                  )}
                </div>
              )
            })()}

            <p className="text-xs text-zinc-500 text-center mt-6">
              {t.cancelAnytime}
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
              {t.logout}
            </button>
          </div>
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
