'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, LockKeyhole } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Language, getInitialLanguage } from '@/lib/i18n'
import { StandaloneLanguageSwitcher } from '@/components/ui/LanguageSwitcher'

type Plan = 'monthly' | 'annual' | 'masu'

function SubscribeForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [checking, setChecking] = useState(true)
  const [paying, setPaying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState('')
  const [language, setLanguage] = useState<Language>('ja')
  const [japan, setJapan] = useState(true)
  const [plan, setPlan] = useState<Plan>('monthly')
  const ja = language === 'ja'
  const canceled = params.get('canceled') === 'true'

  useEffect(() => {
    setVerified(false)
    setLanguage(getInitialLanguage())
    const requested = params.get('plan')
    setPlan(requested === 'annual' || requested === 'masu' ? requested : 'monthly')
    const region = params.get('region')
    setJapan(region ? region === 'jp' : navigator.language.startsWith('ja') || Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Tokyo')
    let disposed = false
    async function checkUser() {
      try {
        const sb = createClient()
        const { data: { user }, error: authError } = await sb.auth.getUser()
        if (!user) {
          if (authError && authError.name !== 'AuthSessionMissingError') throw authError
          router.replace(`/auth/login?redirect=${encodeURIComponent(`/auth/subscribe?${params.toString()}`)}`)
          return
        }
        const { data: profile, error: profileError } = await sb.from('profiles').select('subscription_status').eq('id', user.id).single()
        if (profileError) throw profileError
        // 特別招待会員は既に有料相当。通常の無料会員 (free_tier) は購入可能。
        if (profile?.subscription_status === 'active' || profile?.subscription_status === 'free') {
          router.replace('/app')
          return
        }
        if (!disposed) { setVerified(true); setChecking(false) }
      } catch {
        if (!disposed) {
          setError(getInitialLanguage() === 'ja' ? '会員情報を確認できませんでした。ページを再読み込みしてください。' : 'Could not verify membership. Please reload the page.')
          setChecking(false)
        }
      }
    }
    checkUser()
    return () => { disposed = true }
  }, [params, router])

  async function checkout() {
    setPaying(true)
    setError('')
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isJapan: japan, plan }),
      })
      const data = await response.json()
      if (!response.ok || !data.url) throw new Error('checkout_failed')
      window.location.assign(data.url)
    } catch {
      setError(ja ? '決済画面を開けませんでした。時間をおいてもう一度お試しいただくか、別のプランを選んでください。' : 'Could not open checkout. Try again in a moment or choose another plan.')
      setPaying(false)
    }
  }

  const price = (p: Plan) => p === 'masu' ? (ja ? '決済画面で確認' : 'See price at checkout') : japan ? p === 'annual' ? '¥9,800' : '¥980' : p === 'annual' ? '$100' : '$10'
  return <main lang={language} className="min-h-screen bg-[#f8f7f0] text-[#243c32] px-5 py-8">
    <div className="mx-auto max-w-xl">
      <div className="flex items-center justify-between mb-10"><Link href="/#membership" className="flex items-center gap-2 text-xs"><ArrowLeft size={15} />{ja ? '参加プランに戻る' : 'Back to plans'}</Link><StandaloneLanguageSwitcher language={language} onLanguageChange={lang => { setLanguage(lang); localStorage.setItem('fomus-guild-language', lang) }} theme="light" /></div>
      <p className="text-xs tracking-[.2em] mb-5">FOMUS GUILD / MEMBERSHIP</p>
      <h1 className="text-3xl font-bold leading-relaxed">{ja ? 'もっと深く、ギルドを楽しもう。' : 'Go deeper into the guild.'}</h1>
      <ol className="flex gap-3 text-xs my-6 text-stone-500"><li>{ja ? '01 メール認証' : '01 Verify email'}</li><li aria-current="step" className="font-bold text-[#243c32]">{ja ? '02 プラン確認' : '02 Review plan'}</li><li>{ja ? '03 お支払い' : '03 Payment'}</li></ol>
      {checking ? <p role="status" className="py-14 text-center">{ja ? '会員情報を確認しています…' : 'Checking your membership…'}</p> : <>
        {canceled && <p role="status" className="p-4 mb-5 rounded-lg bg-amber-100 text-amber-900 text-sm">{ja ? '決済は完了していません。プランを確認して、もう一度進めます。' : 'Checkout was not completed. Review your plan and try again.'}</p>}
        <div className="rounded-xl border border-[#d1d8c8] bg-white p-6 sm:p-8">
          <h2 className="font-bold text-lg">GUILD MEMBER</h2>
          <ul className="space-y-3 text-sm my-5">{(ja ? ['ギルドマップでメンバー・MASU Hubを探す', '公開中のメンバーの場所・プロフィールを閲覧', 'クエスト・ポイント交換・会員証', '無料記事と、まっすーの有料限定記事'] : ['Find members and MASU Hubs on the guild map', 'View shared member locations and profiles', 'Quests, reward exchanges, and member card', 'Free and premium journal posts']).map(item => <li key={item} className="flex items-start gap-2"><Check size={17} className="shrink-0" />{item}</li>)}</ul>
          <fieldset disabled={paying} className="disabled:opacity-60">
            <label className="block text-xs font-semibold mb-6">{ja ? 'お住まいの地域' : 'Your region'}<select value={japan ? 'jp' : 'intl'} onChange={e => { setJapan(e.target.value === 'jp'); if (e.target.value !== 'jp' && plan === 'masu') setPlan('annual') }} className="mt-2 block w-full border border-stone-300 rounded-lg p-3 bg-white text-sm"><option value="jp">{ja ? '日本 / 日本円' : 'Japan / JPY'}</option><option value="intl">{ja ? '日本以外 / 米ドル' : 'Outside Japan / USD'}</option></select></label>
            <legend className="sr-only">{ja ? 'お支払いプラン' : 'Billing plan'}</legend>
            <div className="space-y-3">{(['monthly', 'annual'] as const).map(p => <label key={p} className={`flex gap-3 items-start cursor-pointer p-4 border rounded-lg ${plan === p ? 'border-[#243c32] bg-[#edf0e6]' : 'border-stone-200'}`}><input type="radio" name="plan" value={p} checked={plan === p} onChange={() => setPlan(p)} className="mt-1 accent-[#243c32]" /><span className="flex-1"><span className="flex justify-between gap-2 text-sm font-semibold"><span>{p === 'monthly' ? ja ? '月額プラン' : 'Monthly' : ja ? '年額プラン' : 'Annual'}</span><span>{price(p)}{p === 'monthly' ? ja ? '/月' : '/mo' : ja ? '/年' : '/yr'}</span></span><span className="block text-xs text-stone-500 mt-2">{p === 'monthly' ? ja ? '毎月のお支払い・いつでも解約可能' : 'Billed monthly. Cancel anytime.' : ja ? '年額一括払い・月払いより2ヶ月分お得' : 'Billed annually. Save two months.'}</span></span></label>)}</div>
            {japan && <details className="mt-4" open={plan === 'masu' || undefined}><summary className="text-xs cursor-pointer text-stone-600">{ja ? '枡セット付き年額プランも見る' : 'Explore annual membership with a Masu set'}</summary><label className="flex gap-3 items-start border border-stone-200 rounded-lg p-4 mt-3 cursor-pointer"><input type="radio" name="plan" checked={plan === 'masu'} onChange={() => setPlan('masu')} className="mt-1 accent-[#243c32]" /><span className="text-sm">{ja ? '年額会員＋枡セット（日本国内発送）' : 'Annual + Masu set (Japan shipping only)'}<span className="block text-xs text-stone-500 mt-2">{ja ? '価格・配送情報は決済画面で確認してからお支払いください。' : 'Review price and shipping details at checkout before paying.'}</span></span></label></details>}
          </fieldset>
          {error && <p role="alert" className="text-red-800 bg-red-50 rounded-lg p-3 text-sm mt-5">{error}</p>}
          <div className="border-t border-stone-200 mt-6 pt-5 flex justify-between text-sm"><span>{ja ? '選択中のプラン' : 'Selected plan'}</span><strong>{price(plan)}{plan !== 'masu' && (plan === 'annual' ? ja ? '/年' : '/yr' : ja ? '/月' : '/mo')}</strong></div>
          <button onClick={checkout} disabled={paying || !verified} className="w-full flex justify-between items-center mt-5 bg-[#d6502c] hover:bg-[#b74021] text-white font-semibold text-sm rounded-lg p-4 disabled:opacity-50 disabled:cursor-not-allowed">{paying ? ja ? '決済画面を開いています…' : 'Opening checkout…' : ja ? 'Stripeの決済画面へ進む' : 'Continue to Stripe checkout'}<ArrowRight size={18} /></button>
          <p className="text-xs text-stone-500 leading-relaxed mt-4">{ja ? '有料プランは自動更新です。最終的な請求額と利用できる支払い方法は、次の決済画面で確認できます。' : 'Paid plans renew automatically. Review the final amount and available payment methods on the next screen.'}</p>
          <p className="text-xs text-stone-500 flex items-center gap-2 mt-3"><LockKeyhole size={13} />{ja ? '支払い情報はStripeの決済画面で入力します' : 'Payment details are entered on Stripe'}</p>
        </div>
        <div className="text-center mt-7"><Link href="/app" className="text-sm underline underline-offset-4">{ja ? '今は無料で楽しむ' : 'Continue with free membership'}</Link></div>
      </>}
    </div>
  </main>
}

export default function SubscribePage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#f8f7f0] text-[#243c32] flex items-center justify-center" role="status">Loading…</main>}><SubscribeForm /></Suspense>
}
