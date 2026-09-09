'use client'

import Link from 'next/link'
import { useLanguage } from '@/lib/i18n'
import { SectionSwitch } from './SectionSwitch'
import { ThemeToggle, useReadingTheme } from '@/app/app/feed/FeedClient'

interface Region { key: string; ja: string; en: string; emoji: string; count: number; from: string; to: string; thumbnail: string | null }

export function ArchiveHome({ regions, total }: { regions: Region[]; total: number }) {
  const { language } = useLanguage()
  const ja = language === 'ja'
  const { light, setLight } = useReadingTheme()
  return (
    <div className={light ? 'bg-white min-h-screen' : ''}>
      <div className="p-4 md:p-8 max-w-2xl mx-auto pb-24">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h1 className={`text-2xl font-bold ${light ? 'text-zinc-900' : 'text-white'}`}>{ja ? '海外活動記録' : 'Overseas Archive'}</h1>
          <ThemeToggle light={light} setLight={setLight} ja={ja} />
        </div>
        <p className={`text-sm mb-5 ${light ? 'text-zinc-600' : 'text-zinc-400'}`}>
          {ja ? `アドレスホッパー時代の記録、全${total}本。日本語／英語で読めます。` : `${total} posts from the address-hopper years, in Japanese and English.`}
        </p>
        <SectionSwitch light={light} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {regions.map((r) => (
            <Link key={r.key} href={`/app/archive/${r.key}`} className={`flex gap-3 rounded-2xl border overflow-hidden transition-colors ${light ? 'bg-white border-zinc-200 hover:border-zinc-400' : 'bg-zinc-800/60 border-zinc-700/50 hover:border-zinc-500'}`}>
              <div className="w-24 shrink-0 bg-zinc-900">
                {r.thumbnail && <img src={r.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />}
              </div>
              <div className="py-3 pr-3 min-w-0">
                <p className={`font-semibold leading-snug ${light ? 'text-zinc-900' : 'text-white'}`}>{r.emoji} {ja ? r.ja : r.en}</p>
                <p className={`text-xs mt-1 ${light ? 'text-zinc-500' : 'text-zinc-400'}`}>{r.count}{ja ? '本' : ' posts'} · {r.from.slice(0, 7).replace('.', '/')}〜{r.to.slice(0, 7).replace('.', '/')}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
