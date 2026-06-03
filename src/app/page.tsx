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
              Invitation Only
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
                  <>FOMUS GUILDは、日本の伝統工芸「枡」を起点に生まれた招待制のコミュニティです。</>
                ) : (
                  <>FOMUS GUILD is an invitation-only community born from the Japanese craft of Masu.</>
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
              <div className="flex flex-col sm:flex-row items-center gap-4 md:justify-start justify-center">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center px-8 py-3.5 bg-stone-800 text-white rounded-full font-medium text-sm md:text-base hover:bg-stone-700 transition-colors min-w-[180px] shadow-lg"
                >
                  {language === 'ja' ? 'ギルドに入る' : 'Enter the Guild'}
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

      {/* Benefits */}
      <section className="w-full px-6 md:px-8 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="border-t border-stone-200 pt-10">
            <p className="text-xs text-stone-400 tracking-widest uppercase text-center mb-8">
              {language === 'ja' ? 'メンバー特典' : 'Member Benefits'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl mb-3">🏔️</div>
                <h3 className="text-sm font-medium text-stone-700 mb-2">
                  {language === 'ja' ? '笛吹BASEへの訪問権' : 'Access to Fuefuki BASE'}
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  {language === 'ja'
                    ? 'まっすーの山梨・笛吹の拠点に立ち寄れます。ドリンク片手に語りましょう。'
                    : "Drop by MaSU's base in Fuefuki, Yamanashi. Let's talk over drinks."}
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-3">🌍</div>
                <h3 className="text-sm font-medium text-stone-700 mb-2">
                  {language === 'ja' ? 'グローバルな仲間' : 'Global Community'}
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  {language === 'ja'
                    ? '世界各地のメンバーとつながり、文化・挑戦・日常をシェアする場。'
                    : 'Connect with members around the world. Share culture, challenges, and everyday life.'}
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-3">🎴</div>
                <h3 className="text-sm font-medium text-stone-700 mb-2">
                  {language === 'ja' ? '限定コンテンツ＆特典' : 'Exclusive Content & Perks'}
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  {language === 'ja'
                    ? 'クエスト、ポイント、限定ショップなど、メンバーだけの体験を。'
                    : 'Quests, points, exclusive shop — experiences only for members.'}
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
