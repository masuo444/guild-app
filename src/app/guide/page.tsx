'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Language, getInitialLanguage, getTranslations } from '@/lib/i18n'
import { StandaloneLanguageSwitcher } from '@/components/ui/LanguageSwitcher'

const LANGUAGE_KEY = 'fomus-guild-language'

// Screenshot placeholder when image doesn't exist
function ScreenshotFrame({ src, alt }: { src: string; alt: string }) {
  const [hasError, setHasError] = useState(false)

  return (
    <div className="relative w-full max-w-[260px] mx-auto aspect-[9/19] rounded-[2rem] border-4 border-stone-300 bg-stone-900 shadow-lg overflow-hidden">
      {!hasError ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400">
          <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 0 0 1.5-1.5V5.25a1.5 1.5 0 0 0-1.5-1.5H3.75a1.5 1.5 0 0 0-1.5 1.5v14.25a1.5 1.5 0 0 0 1.5 1.5Z" />
          </svg>
          <p className="text-xs">{alt}</p>
        </div>
      )}
    </div>
  )
}

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
          <div className="max-w-4xl mx-auto flex justify-between items-center">
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
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-semibold text-stone-800">FOMUS GUILD</h1>
            <p className="text-sm text-stone-500">{t.guideTitle}</p>
          </div>
        </div>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-6 md:px-8 py-8 md:py-12 space-y-12">

          {/* ─── Hero ─── */}
          <section className="print-break bg-gradient-to-br from-amber-100 via-orange-50 to-amber-50 rounded-2xl p-8 md:p-12 shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-bold text-stone-800 mb-4">FOMUS GUILD</h2>
                <p className="text-lg md:text-xl text-stone-700 mb-2">{t.aboutHeroCatchcopy}</p>
                <p className="text-sm text-stone-500">{t.guideHeroIntro}</p>
              </div>
              <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-2xl overflow-hidden shadow-lg flex-shrink-0">
                <Image src="/fomus-masu.png" alt="FOMUS MASU" fill className="object-cover" priority />
              </div>
            </div>
          </section>

          {/* ─── 5 Feature Cards ─── */}
          <section className="print-break">
            <h2 className="text-xl md:text-2xl font-semibold text-stone-800 mb-4">{t.aboutFeaturesTitle}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Card */}
              <FeatureCard
                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25h-15a2.25 2.25 0 0 0-2.25 2.25v10.5a2.25 2.25 0 0 0 2.25 2.25Z" />}
                color="orange"
                title={t.aboutFeature1Title}
                desc={t.guideCardDesc}
              />
              {/* Map */}
              <FeatureCard
                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />}
                color="green"
                title={t.guideMapTitle}
                desc={t.guideMapDesc}
              />
              {/* Quests */}
              <FeatureCard
                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m4.894-1.228a49.424 49.424 0 0 0-3.933-.956M5.586 8.5a49.424 49.424 0 0 1 3.933-.956m7.962 0c-.092 1.14-.28 2.248-.555 3.309m-7.376-3.31c.093 1.14.282 2.249.556 3.31" />}
                color="purple"
                title={t.guideQuestTitle}
                desc={t.guideQuestDesc}
              />
              {/* Login Bonus */}
              <FeatureCard
                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />}
                color="yellow"
                title={t.guideBonusTitle}
                desc={t.guideBonusDesc}
              />
              {/* Invite */}
              <FeatureCard
                icon={<path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />}
                color="blue"
                title={t.aboutFeature5Title}
                desc={t.aboutFeature5Desc}
              />
            </div>
          </section>

          {/* ─── How-To Section Header ─── */}
          <section className="print-break text-center py-2">
            <h2 className="text-2xl md:text-3xl font-bold text-stone-800 mb-2">{t.guideHowToTitle}</h2>
            <p className="text-sm text-stone-500">{t.guideHowToSubtitle}</p>
          </section>

          {/* ─── A. Getting Started ─── */}
          <HowToSection
            direction="left"
            color="emerald"
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.841m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />}
            title={t.guideGettingStartedTitle}
            desc={t.guideGettingStartedDesc}
            steps={[t.guideGettingStartedStep1, t.guideGettingStartedStep2, t.guideGettingStartedStep3, t.guideGettingStartedStep4]}
            screenshots={[
              { src: '/screenshots/guide-welcome.jpg', label: 'STEP 1' },
              { src: '/screenshots/guide-payment.jpg', label: 'STEP 2' },
              { src: '/screenshots/guide-payment-complete.jpg', label: 'STEP 3' },
              { src: '/screenshots/guide-email-verify.jpg', label: 'STEP 4' },
            ]}
            screenshotAlt={t.guideScreenshotAlt}
          />

          {/* ─── B. Membership Card ─── */}
          <HowToSection
            direction="right"
            color="orange"
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25h-15a2.25 2.25 0 0 0-2.25 2.25v10.5a2.25 2.25 0 0 0 2.25 2.25Z" />}
            title={t.guideCardDetailTitle}
            desc={t.guideCardDetailDesc}
            steps={[t.guideCardDetailFront, t.guideCardDetailBack, t.guideCardDetailRankPoints]}
            screenshot="/screenshots/guide-dashboard.jpg"
            screenshotAlt={t.guideScreenshotAlt}
          >
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 mt-4">
              <h3 className="text-sm font-semibold text-stone-700 mb-1">{t.guideCardRankSystem}</h3>
              <p className="text-lg font-mono font-semibold text-orange-600 tracking-wider">{t.guideCardRanks}</p>
            </div>
          </HowToSection>

          {/* ─── C. Guild Map ─── */}
          <HowToSection
            direction="left"
            color="green"
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />}
            title={t.guideMapUsageTitle}
            desc={t.guideMapUsageDesc}
            steps={[t.guideMapUsageStep1, t.guideMapUsageStep2, t.guideMapUsageStep3, t.guideMapUsageStep4]}
            screenshot="/screenshots/guide-map.jpg"
            screenshotAlt={t.guideScreenshotAlt}
          />

          {/* ─── D. Quests & Points ─── */}
          <HowToSection
            direction="right"
            color="purple"
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m4.894-1.228a49.424 49.424 0 0 0-3.933-.956M5.586 8.5a49.424 49.424 0 0 1 3.933-.956m7.962 0c-.092 1.14-.28 2.248-.555 3.309m-7.376-3.31c.093 1.14.282 2.249.556 3.31" />}
            title={t.guideQuestHowTitle}
            desc={t.guideQuestHowDesc}
            steps={[t.guideQuestHowStep1, t.guideQuestHowStep2, t.guideQuestHowStep3, t.guideQuestHowStep4]}
            screenshot="/screenshots/guide-quests.jpg"
            screenshotAlt={t.guideScreenshotAlt}
          >
            {/* Login Bonus sub-section */}
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-stone-700 mb-2">{t.guideBonusTitle}</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-amber-600">+10pt</p>
                  <p className="text-[10px] text-stone-500">{t.guideBonusDaily}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-orange-600">+50pt</p>
                  <p className="text-[10px] text-stone-500">{t.guideBonus7day}</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-red-500">+150pt</p>
                  <p className="text-[10px] text-stone-500">{t.guideBonus30day}</p>
                </div>
              </div>
            </div>
          </HowToSection>

          {/* ─── E. Profile & Invite ─── */}
          <HowToSection
            direction="left"
            color="blue"
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />}
            title={t.guideProfileTitle}
            desc={t.guideProfileDesc}
            steps={[t.guideProfileSetupStep1, t.guideProfileSetupStep2, t.guideProfileSetupStep3, t.guideProfileSetupStep4, t.guideInviteHowStep2, t.guideInviteHowStep3]}
            screenshot="/screenshots/guide-profile.jpg"
            screenshotAlt={t.guideScreenshotAlt}
          />

          {/* ─── F. PWA Install ─── */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-bold text-stone-700 mb-2">{t.guidePwaInstallAndroidTitle}</p>
                <ol className="space-y-2">
                  {[t.guidePwaInstallAndroid1, t.guidePwaInstallAndroid2].map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">{i + 1}</span>
                      <span className="text-sm text-stone-600">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <p className="text-sm font-bold text-stone-700 mb-2">{t.guidePwaInstallIosTitle}</p>
                <ol className="space-y-2">
                  {[t.guidePwaInstallIos1, t.guidePwaInstallIos2, t.guidePwaInstallIos3].map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">{i + 1}</span>
                      <span className="text-sm text-stone-600">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>

          {/* ─── Footer CTA ─── */}
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
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xs text-stone-400">&copy; FOMUS</p>
          </div>
        </footer>
      </div>
    </>
  )
}

/* ─── Sub-components ─── */

const colorMap: Record<string, { bg: string; text: string; badge: string }> = {
  orange:  { bg: 'bg-orange-100',  text: 'text-orange-600',  badge: 'bg-orange-500' },
  green:   { bg: 'bg-green-100',   text: 'text-green-600',   badge: 'bg-green-500' },
  purple:  { bg: 'bg-purple-100',  text: 'text-purple-600',  badge: 'bg-purple-500' },
  yellow:  { bg: 'bg-yellow-100',  text: 'text-yellow-600',  badge: 'bg-yellow-500' },
  blue:    { bg: 'bg-blue-100',    text: 'text-blue-600',    badge: 'bg-blue-500' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', badge: 'bg-emerald-500' },
  indigo:  { bg: 'bg-indigo-100',  text: 'text-indigo-600',  badge: 'bg-indigo-500' },
}

function FeatureCard({ icon, color, title, desc }: { icon: React.ReactNode; color: string; title: string; desc: string }) {
  const c = colorMap[color] ?? colorMap.orange
  return (
    <div className="bg-white/80 backdrop-blur rounded-xl p-5 shadow-sm">
      <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center mb-3`}>
        <svg className={`w-5 h-5 ${c.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>{icon}</svg>
      </div>
      <h3 className="font-semibold text-stone-800 mb-1">{title}</h3>
      <p className="text-sm text-stone-600 leading-relaxed">{desc}</p>
    </div>
  )
}

function HowToSection({
  direction,
  color,
  icon,
  title,
  desc,
  steps,
  screenshot,
  screenshots,
  screenshotAlt,
  children,
}: {
  direction: 'left' | 'right'
  color: string
  icon: React.ReactNode
  title: string
  desc: string
  steps: string[]
  screenshot?: string
  screenshots?: { src: string; label?: string }[]
  screenshotAlt: string
  children?: React.ReactNode
}) {
  const c = colorMap[color] ?? colorMap.orange
  const isLeft = direction === 'left'
  const hasMultiple = screenshots && screenshots.length > 1

  return (
    <section className="print-break bg-white/80 backdrop-blur rounded-2xl p-6 md:p-8 shadow-sm">
      <div className={`flex flex-col ${!hasMultiple ? (isLeft ? 'md:flex-row' : 'md:flex-row-reverse') : ''} gap-6 md:gap-8 items-start`}>
        {/* Text side */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
              <svg className={`w-6 h-6 ${c.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>{icon}</svg>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-stone-800">{title}</h2>
            </div>
          </div>
          <p className="text-stone-600 leading-relaxed mb-5">{desc}</p>
          <ol className="space-y-3">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className={`w-6 h-6 rounded-full ${c.badge} text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5`}>{i + 1}</span>
                <span className="text-sm text-stone-600">{step}</span>
              </li>
            ))}
          </ol>
          {children}
        </div>
        {/* Screenshot side */}
        {hasMultiple ? (
          <div className="w-full overflow-x-auto -mx-2 px-2">
            <div className="flex gap-4 pb-2 justify-start md:justify-center">
              {screenshots.map((s, i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div className="relative w-[160px] sm:w-[180px] aspect-[9/19] rounded-[1.5rem] border-[3px] border-stone-300 bg-stone-900 shadow-md overflow-hidden">
                    <Image src={s.src} alt={screenshotAlt} fill className="object-contain" />
                  </div>
                  {s.label && (
                    <span className={`text-[10px] font-medium ${c.text} bg-white/80 px-2 py-0.5 rounded-full`}>
                      {s.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full md:w-auto flex-shrink-0 flex justify-center">
            <ScreenshotFrame src={screenshot || (screenshots?.[0]?.src ?? '')} alt={screenshotAlt} />
          </div>
        )}
      </div>
    </section>
  )
}
