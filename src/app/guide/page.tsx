'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Language, getInitialLanguage, getTranslations } from '@/lib/i18n'
import { StandaloneLanguageSwitcher } from '@/components/ui/LanguageSwitcher'

const LANGUAGE_KEY = 'fomus-guild-language'

export default function GuidePage() {
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

  const t = getTranslations(language)

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border border-amber-300 border-t-amber-600 rounded-full" />
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-break { page-break-inside: avoid; }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-green-50 text-stone-800">
        {/* Header */}
        <header className="w-full p-6 md:p-8 no-print">
          <div className="max-w-3xl mx-auto flex justify-between items-center">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <h1 className="text-lg md:text-xl font-semibold tracking-wide text-stone-700">
                FOMUS GUILD
              </h1>
              <p className="text-xs text-stone-500 tracking-widest mt-0.5">
                {t.guideTitle}
              </p>
            </Link>
            <div className="flex items-center gap-3">
              <StandaloneLanguageSwitcher
                language={language}
                onLanguageChange={handleLanguageChange}
                theme="light"
              />
              <Link
                href="/auth/login"
                className="hidden sm:inline-flex items-center justify-center px-5 py-2 bg-stone-800 text-white rounded-full text-sm font-medium hover:bg-stone-700 transition-colors"
              >
                {t.guideEnterGuild}
              </Link>
            </div>
          </div>
        </header>

        {/* Print Header */}
        <div className="hidden print:block p-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-semibold text-stone-800">FOMUS GUILD</h1>
            <p className="text-sm text-stone-500">{t.guideTitle}</p>
          </div>
        </div>

        {/* Content */}
        <main className="max-w-3xl mx-auto px-6 md:px-8 py-8 md:py-12 space-y-8">

          {/* Section 1: What is FOMUS GUILD */}
          <section className="print-break bg-white/80 backdrop-blur rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.466.729-3.418" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-stone-800">{t.guideWhatIsTitle}</h2>
              </div>
            </div>
            <p className="text-stone-600 leading-relaxed mb-5">{t.guideWhatIsDesc}</p>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-3 text-sm text-stone-600">
                <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </span>
                {t.guideWhatIsInvite}
              </li>
              <li className="flex items-center gap-3 text-sm text-stone-600">
                <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </span>
                {t.guideWhatIsGlobal}
              </li>
              <li className="flex items-center gap-3 text-sm text-stone-600">
                <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </span>
                {t.guideWhatIsCulture}
              </li>
            </ul>
          </section>

          {/* Section 2: Membership Card */}
          <section className="print-break bg-white/80 backdrop-blur rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25h-15a2.25 2.25 0 0 0-2.25 2.25v10.5a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-stone-800">{t.guideCardTitle}</h2>
              </div>
            </div>
            <p className="text-stone-600 leading-relaxed mb-5">{t.guideCardDesc}</p>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-stone-700 mb-2">{t.guideCardRankSystem}</h3>
              <p className="text-lg font-mono font-semibold text-orange-600 mb-2 tracking-wider">{t.guideCardRanks}</p>
              <p className="text-sm text-stone-500">{t.guideCardRankDesc}</p>
            </div>
          </section>

          {/* Section 3: Guild Map */}
          <section className="print-break bg-white/80 backdrop-blur rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-stone-800">{t.guideMapTitle}</h2>
              </div>
            </div>
            <p className="text-stone-600 leading-relaxed mb-5">{t.guideMapDesc}</p>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-3 text-sm text-stone-600">
                <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </span>
                {t.guideMapMembers}
              </li>
              <li className="flex items-center gap-3 text-sm text-stone-600">
                <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </span>
                {t.guideMapHubs}
              </li>
              <li className="flex items-center gap-3 text-sm text-stone-600">
                <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </span>
                {t.guideMapConnect}
              </li>
            </ul>
          </section>

          {/* Section 4: Quests & Benefits */}
          <section className="print-break bg-white/80 backdrop-blur rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m4.894-1.228a49.424 49.424 0 0 0-3.933-.956M5.586 8.5a49.424 49.424 0 0 1 3.933-.956m7.962 0c-.092 1.14-.28 2.248-.555 3.309m-7.376-3.31c.093 1.14.282 2.249.556 3.31" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-stone-800">{t.guideQuestTitle}</h2>
              </div>
            </div>
            <p className="text-stone-600 leading-relaxed mb-5">{t.guideQuestDesc}</p>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-3 text-sm text-stone-600">
                <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </span>
                {t.guideQuestEarn}
              </li>
              <li className="flex items-center gap-3 text-sm text-stone-600">
                <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </span>
                {t.guideQuestServices}
              </li>
              <li className="flex items-center gap-3 text-sm text-stone-600">
                <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </span>
                {t.guideQuestArticles}
              </li>
              <li className="flex items-center gap-3 text-sm text-stone-600">
                <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </span>
                {t.guideQuestExchange}
              </li>
            </ul>
          </section>

          {/* Section 5: Login Bonus */}
          <section className="print-break bg-white/80 backdrop-blur rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-stone-800">{t.guideBonusTitle}</h2>
              </div>
            </div>
            <p className="text-stone-600 leading-relaxed mb-5">{t.guideBonusDesc}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-amber-600 mb-1">+10pt</p>
                <p className="text-xs text-stone-500">{t.guideBonusDaily}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-orange-600 mb-1">+50pt</p>
                <p className="text-xs text-stone-500">{t.guideBonus7day}</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-red-500 mb-1">+150pt</p>
                <p className="text-xs text-stone-500">{t.guideBonus30day}</p>
              </div>
            </div>
          </section>

          {/* Section 6: Profile & Invites */}
          <section className="print-break bg-white/80 backdrop-blur rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-stone-800">{t.guideProfileTitle}</h2>
              </div>
            </div>
            <p className="text-stone-600 leading-relaxed mb-5">{t.guideProfileDesc}</p>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-3 text-sm text-stone-600">
                <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </span>
                {t.guideProfileCustomize}
              </li>
              <li className="flex items-center gap-3 text-sm text-stone-600">
                <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </span>
                {t.guideProfileLocation}
              </li>
              <li className="flex items-center gap-3 text-sm text-stone-600">
                <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </span>
                {t.guideProfileInvite}
              </li>
            </ul>
          </section>

          {/* How-To Detailed Guide */}
          <section className="print-break text-center py-4">
            <h2 className="text-2xl md:text-3xl font-bold text-stone-800 mb-2">{t.guideHowToTitle}</h2>
            <p className="text-sm text-stone-500">{t.guideHowToSubtitle}</p>
          </section>

          {/* Section A: Getting Started */}
          <section className="print-break bg-white/80 backdrop-blur rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.841m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-stone-800">{t.guideGettingStartedTitle}</h2>
              </div>
            </div>
            <p className="text-stone-600 leading-relaxed mb-5">{t.guideGettingStartedDesc}</p>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">1</span>
                <span className="text-sm text-stone-600">{t.guideGettingStartedStep1}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">2</span>
                <span className="text-sm text-stone-600">{t.guideGettingStartedStep2}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">3</span>
                <span className="text-sm text-stone-600">{t.guideGettingStartedStep3}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">4</span>
                <span className="text-sm text-stone-600">{t.guideGettingStartedStep4}</span>
              </li>
            </ol>
          </section>

          {/* Section B: Profile Setup */}
          <section className="print-break bg-white/80 backdrop-blur rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-stone-800">{t.guideProfileSetupTitle}</h2>
              </div>
            </div>
            <p className="text-stone-600 leading-relaxed mb-5">{t.guideProfileSetupDesc}</p>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">1</span>
                <span className="text-sm text-stone-600">{t.guideProfileSetupStep1}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">2</span>
                <span className="text-sm text-stone-600">{t.guideProfileSetupStep2}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">3</span>
                <span className="text-sm text-stone-600">{t.guideProfileSetupStep3}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">4</span>
                <span className="text-sm text-stone-600">{t.guideProfileSetupStep4}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">5</span>
                <span className="text-sm text-stone-600">{t.guideProfileSetupStep5}</span>
              </li>
            </ol>
          </section>

          {/* Section C: Card Details */}
          <section className="print-break bg-white/80 backdrop-blur rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25h-15a2.25 2.25 0 0 0-2.25 2.25v10.5a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-stone-800">{t.guideCardDetailTitle}</h2>
              </div>
            </div>
            <p className="text-stone-600 leading-relaxed mb-5">{t.guideCardDetailDesc}</p>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">1</span>
                <span className="text-sm text-stone-600">{t.guideCardDetailFront}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">2</span>
                <span className="text-sm text-stone-600">{t.guideCardDetailBack}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">3</span>
                <span className="text-sm text-stone-600">{t.guideCardDetailRankPoints}</span>
              </li>
            </ol>
          </section>

          {/* Section D: Map Usage */}
          <section className="print-break bg-white/80 backdrop-blur rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-stone-800">{t.guideMapUsageTitle}</h2>
              </div>
            </div>
            <p className="text-stone-600 leading-relaxed mb-5">{t.guideMapUsageDesc}</p>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">1</span>
                <span className="text-sm text-stone-600">{t.guideMapUsageStep1}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">2</span>
                <span className="text-sm text-stone-600">{t.guideMapUsageStep2}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">3</span>
                <span className="text-sm text-stone-600">{t.guideMapUsageStep3}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">4</span>
                <span className="text-sm text-stone-600">{t.guideMapUsageStep4}</span>
              </li>
            </ol>
          </section>

          {/* Section E: Quest How-To */}
          <section className="print-break bg-white/80 backdrop-blur rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m4.894-1.228a49.424 49.424 0 0 0-3.933-.956M5.586 8.5a49.424 49.424 0 0 1 3.933-.956m7.962 0c-.092 1.14-.28 2.248-.555 3.309m-7.376-3.31c.093 1.14.282 2.249.556 3.31" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-stone-800">{t.guideQuestHowTitle}</h2>
              </div>
            </div>
            <p className="text-stone-600 leading-relaxed mb-5">{t.guideQuestHowDesc}</p>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">1</span>
                <span className="text-sm text-stone-600">{t.guideQuestHowStep1}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">2</span>
                <span className="text-sm text-stone-600">{t.guideQuestHowStep2}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">3</span>
                <span className="text-sm text-stone-600">{t.guideQuestHowStep3}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">4</span>
                <span className="text-sm text-stone-600">{t.guideQuestHowStep4}</span>
              </li>
            </ol>
          </section>

          {/* Section F: Point Exchange */}
          <section className="print-break bg-white/80 backdrop-blur rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-stone-800">{t.guideExchangeHowTitle}</h2>
              </div>
            </div>
            <p className="text-stone-600 leading-relaxed mb-5">{t.guideExchangeHowDesc}</p>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">1</span>
                <span className="text-sm text-stone-600">{t.guideExchangeHowStep1}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">2</span>
                <span className="text-sm text-stone-600">{t.guideExchangeHowStep2}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">3</span>
                <span className="text-sm text-stone-600">{t.guideExchangeHowStep3}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">4</span>
                <span className="text-sm text-stone-600">{t.guideExchangeHowStep4}</span>
              </li>
            </ol>
          </section>

          {/* Section G: Invite Friends */}
          <section className="print-break bg-white/80 backdrop-blur rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-stone-800">{t.guideInviteHowTitle}</h2>
              </div>
            </div>
            <p className="text-stone-600 leading-relaxed mb-5">{t.guideInviteHowDesc}</p>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">1</span>
                <span className="text-sm text-stone-600">{t.guideInviteHowStep1}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">2</span>
                <span className="text-sm text-stone-600">{t.guideInviteHowStep2}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">3</span>
                <span className="text-sm text-stone-600">{t.guideInviteHowStep3}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">4</span>
                <span className="text-sm text-stone-600">{t.guideInviteHowStep4}</span>
              </li>
            </ol>
          </section>

          {/* Section H: PWA Install */}
          <section className="print-break bg-white/80 backdrop-blur rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-stone-800">{t.guidePwaInstallTitle}</h2>
              </div>
            </div>
            <p className="text-stone-600 leading-relaxed mb-5">{t.guidePwaInstallDesc}</p>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-bold text-stone-700 mb-2">{t.guidePwaInstallAndroidTitle}</p>
                <ol className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">1</span>
                    <span className="text-sm text-stone-600">{t.guidePwaInstallAndroid1}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">2</span>
                    <span className="text-sm text-stone-600">{t.guidePwaInstallAndroid2}</span>
                  </li>
                </ol>
              </div>
              <div>
                <p className="text-sm font-bold text-stone-700 mb-2">{t.guidePwaInstallIosTitle}</p>
                <ol className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">1</span>
                    <span className="text-sm text-stone-600">{t.guidePwaInstallIos1}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">2</span>
                    <span className="text-sm text-stone-600">{t.guidePwaInstallIos2}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">3</span>
                    <span className="text-sm text-stone-600">{t.guidePwaInstallIos3}</span>
                  </li>
                </ol>
              </div>
            </div>
          </section>

          {/* Footer CTA */}
          <section className="print-break bg-gradient-to-br from-stone-800 to-stone-900 rounded-2xl p-6 md:p-8 text-center text-white shadow-lg">
            <h2 className="text-xl md:text-2xl font-semibold mb-3">{t.guideFooterCta}</h2>
            <p className="text-stone-300 text-sm mb-6">{t.guideFooterCtaDesc}</p>
            <Link
              href="/auth/login"
              className="no-print inline-flex items-center justify-center px-8 py-3.5 bg-amber-500 text-white rounded-full font-medium text-sm md:text-base hover:bg-amber-400 transition-colors shadow-lg"
            >
              {t.guideEnterGuild}
            </Link>
            <p className="text-xs text-stone-400 mt-6 no-print">{t.guidePrintNote}</p>
          </section>

        </main>

        {/* Footer */}
        <footer className="w-full p-6 md:p-8">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs text-stone-400">&copy; FOMUS</p>
          </div>
        </footer>
      </div>
    </>
  )
}
