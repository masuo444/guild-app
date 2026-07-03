'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Language, getInitialLanguage } from '@/lib/i18n'
import { StandaloneLanguageSwitcher } from '@/components/ui/LanguageSwitcher'

const LANGUAGE_KEY = 'fomus-guild-language'

export default function HomePage() {
  const [language, setLanguage] = useState<Language>('ja')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const lang = getInitialLanguage()
    setLanguage(lang)
    setIsLoaded(true)
  }, [])

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem(LANGUAGE_KEY, lang)
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border border-amber-300 border-t-amber-600 rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-green-50 text-stone-800 flex flex-col">
      {/* Header */}
      <header className="w-full p-6 md:p-8">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-lg md:text-xl font-semibold tracking-wide text-stone-700">
              FOMUS GUILD
            </h1>
            <p className="text-xs text-stone-500 tracking-widest mt-0.5">
              {language === 'ja' ? '文化共創コミュニティ' : 'Culture Co-creation'}
            </p>
          </div>
          <StandaloneLanguageSwitcher
            language={language}
            onLanguageChange={handleLanguageChange}
            theme="light"
          />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-6 md:px-8 py-8 md:py-12">
        <div className="max-w-4xl mx-auto w-full">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Image */}
            <div className="order-1 md:order-2 flex justify-center">
              <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/fomus-masu.png"
                  alt="FOMUS Masu - Japanese traditional wooden cups"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* Content */}
            <div className="order-2 md:order-1 text-center md:text-left">
              {/* Main Copy */}
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-medium leading-relaxed tracking-wide text-stone-800 mb-6">
                {language === 'ja' ? (
                  <>世界とつながり、<br />日本の文化づくりに<br className="hidden md:block" />関わる場所。</>
                ) : (
                  <>A place to connect<br />with the world and shape<br className="hidden md:block" />Japanese culture.</>
                )}
              </h2>

              {/* Sub Copy */}
              <p className="text-sm md:text-base text-stone-600 leading-relaxed mb-8">
                {language === 'ja' ? (
                  <>FOMUS GUILDは、日本の伝統工芸「枡」を起点に生まれた文化共創コミュニティです。<strong className="font-medium text-stone-700">無料で参加</strong>して、まずは中を覗いてみてください。</>
                ) : (
                  <>FOMUS GUILD is a culture co-creation community born from the Japanese craft of Masu. <strong className="font-medium text-stone-700">Join for free</strong> and take a look inside.</>
                )}
              </p>

              {/* Additional Copy */}
              <p className="text-xs md:text-sm text-stone-500 mb-8 md:mb-10">
                {language === 'ja' ? (
                  <>参加者は「ユーザー」ではなく、<br className="sm:hidden" />文化づくりの"仲間"として迎えられます。</>
                ) : (
                  <>Members are welcomed not as users,<br className="sm:hidden" />but as companions in cultural creation.</>
                )}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-3 md:justify-start justify-center">
                <Link
                  href="/auth/login?join=free"
                  className="inline-flex items-center justify-center px-8 py-3.5 bg-stone-800 text-white rounded-full font-medium text-sm md:text-base hover:bg-stone-700 transition-colors min-w-[180px] shadow-lg"
                >
                  {language === 'ja' ? '無料で参加する' : 'Join for free'}
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center px-6 py-3.5 text-stone-600 rounded-full font-medium text-sm md:text-base hover:text-stone-900 transition-colors"
                >
                  {language === 'ja' ? '招待コードをお持ちの方' : 'Have an invite code'}
                </Link>
              </div>

              {/* Guide Link */}
              <div className="mt-4 flex items-center gap-3 justify-center md:justify-start">
                <Link
                  href="/guide"
                  className="text-xs text-stone-400 hover:text-stone-600 transition-colors underline underline-offset-2"
                >
                  {language === 'ja' ? 'ガイドを見る' : 'View Guide'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Plans: Free vs Paid */}
      <section className="w-full px-6 md:px-8 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="border-t border-stone-200 pt-10">
            <p className="text-xs text-stone-400 tracking-widest uppercase text-center mb-8">
              {language === 'ja' ? 'できること' : 'What You Get'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Free plan */}
              <div className="rounded-2xl border border-stone-200 bg-white/60 p-6">
                <div className="flex items-baseline justify-between mb-4">
                  <h3 className="text-base font-semibold text-stone-800">
                    {language === 'ja' ? '無料で参加' : 'Free'}
                  </h3>
                  <span className="text-xs text-stone-400">
                    {language === 'ja' ? '招待コード不要' : 'No invite needed'}
                  </span>
                </div>
                <ul className="space-y-2.5 text-sm text-stone-600">
                  {(language === 'ja'
                    ? ['クエストに挑戦してポイントを貯める', '限定ショップで交換', 'メンバーカード＆プロフィール', '枡拠点マップの閲覧']
                    : ['Take on quests and earn points', 'Redeem in the members shop', 'Member card & profile', 'Browse the Masu hub map']
                  ).map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-emerald-600 mt-0.5">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/login?join=free"
                  className="mt-6 inline-flex w-full items-center justify-center px-6 py-3 bg-stone-800 text-white rounded-full font-medium text-sm hover:bg-stone-700 transition-colors"
                >
                  {language === 'ja' ? '無料で参加する' : 'Join for free'}
                </Link>
              </div>

              {/* Paid plan */}
              <div className="rounded-2xl border border-amber-300 bg-gradient-to-b from-amber-50 to-white p-6 shadow-sm">
                <div className="flex items-baseline justify-between mb-4">
                  <h3 className="text-base font-semibold text-stone-800">
                    {language === 'ja' ? '有料会員' : 'Paid Member'}
                  </h3>
                  <span className="text-xs font-medium text-amber-700">
                    {language === 'ja' ? '月980円〜' : 'from ¥980/mo'}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mb-4">
                  {language === 'ja' ? '無料でできること + 下記' : 'Everything in Free, plus:'}
                </p>
                <ul className="space-y-2.5 text-sm text-stone-700">
                  {(language === 'ja'
                    ? ['世界のメンバーMAP（誰がどこにいるか）', 'まっすーの限定記事・フィード', '笛吹BASEへの訪問権', 'イベント・企画への優先参加']
                    : ['Global member MAP (who is where)', "MaSU's exclusive articles & feed", 'Access to Fuefuki BASE', 'Priority access to events & projects']
                  ).map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">★</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-center text-xs text-stone-400">
                  {language === 'ja' ? '参加後、アプリ内からいつでもアップグレードできます' : 'Upgrade anytime from inside the app'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full p-6 md:p-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-stone-400">
            {language === 'ja' ? '運営：FOMUS / MaSU' : 'Operated by FOMUS / MaSU'}
          </p>
        </div>
      </footer>
    </div>
  )
}
