'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n'
import type { ArchiveListItem } from '@/lib/archive'
import { ThemeToggle, useReadingTheme } from '@/app/app/feed/FeedClient'

export function ArchiveList({ region, items }: { region: { key: string; ja: string; en: string; emoji: string }; items: ArchiveListItem[] }) {
  const { language } = useLanguage()
  const ja = language === 'ja'
  const { light, setLight } = useReadingTheme()
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const visible = needle
    ? items.filter((a) => [a.title, a.title_en, a.excerpt, a.excerpt_en, a.country, a.country_en].some((s) => (s || '').toLowerCase().includes(needle)))
    : items
  const muted = light ? 'text-zinc-500' : 'text-zinc-400'

  return (
    <div className={light ? 'bg-white min-h-screen' : ''}>
      <div className="p-4 md:p-8 max-w-2xl mx-auto pb-24">
        <div className="flex items-center justify-between gap-3 mb-4">
          <Link href="/app/archive" className={`text-sm ${muted} hover:underline`}>{ja ? '← 海外活動記録' : '← Overseas Archive'}</Link>
          <ThemeToggle light={light} setLight={setLight} ja={ja} />
        </div>
        <h1 className={`text-2xl font-bold mb-1 ${light ? 'text-zinc-900' : 'text-white'}`}>{region.emoji} {ja ? region.ja : region.en}</h1>
        <p className={`text-sm mb-4 ${muted}`}>{items.length}{ja ? '本' : ' posts'}</p>
        <input
          type="search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={ja ? 'この地域の記事を検索' : 'Search this region'}
          className={`w-full mb-4 px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#c0c0c0] ${light ? 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400' : 'bg-white/5 border-zinc-700 text-white placeholder-zinc-500'}`}
        />
        <div className="space-y-3">
          {visible.map((a) => (
            <Link key={a.id} href={`/app/archive/post/${a.id}`} className={`flex gap-3 rounded-2xl border overflow-hidden transition-colors ${light ? 'bg-white border-zinc-200 hover:border-zinc-400' : 'bg-zinc-800/60 border-zinc-700/50 hover:border-zinc-500'}`}>
              {a.thumbnail && (
                <div className="w-24 sm:w-28 shrink-0 bg-zinc-900"><img src={a.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" /></div>
              )}
              <div className="py-3 pr-3 min-w-0 flex-1">
                <p className={`text-[11px] ${muted}`}>#{a.num} · {a.date}{a.country ? ` · ${ja ? a.country : a.country_en || a.country}` : ''}</p>
                <h2 className={`text-[15px] font-semibold leading-snug mt-0.5 ${light ? 'text-zinc-900' : 'text-white'}`}>{ja || !a.title_en ? a.title : a.title_en}</h2>
                <p className={`text-xs leading-relaxed mt-1 line-clamp-2 ${light ? 'text-zinc-600' : 'text-zinc-400'}`}>{ja || !a.excerpt_en ? a.excerpt : a.excerpt_en}</p>
              </div>
            </Link>
          ))}
          {visible.length === 0 && <p className={`text-sm text-center py-10 ${muted}`}>{ja ? '一致する記事がありません' : 'No matching posts'}</p>}
        </div>
      </div>
    </div>
  )
}
