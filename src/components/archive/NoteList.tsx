'use client'

import { useLanguage } from '@/lib/i18n'
import type { NoteArticle } from '@/lib/archive'
import { SectionSwitch } from './SectionSwitch'
import { ThemeToggle, useReadingTheme } from '@/app/app/feed/FeedClient'

export function NoteList({ notes }: { notes: NoteArticle[] }) {
  const { language } = useLanguage()
  const ja = language === 'ja'
  const { light, setLight } = useReadingTheme()
  const muted = light ? 'text-zinc-500' : 'text-zinc-400'
  return (
    <div className={light ? 'bg-white min-h-screen' : ''}>
      <div className="p-4 md:p-8 max-w-2xl mx-auto pb-24">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h1 className={`text-2xl font-bold ${light ? 'text-zinc-900' : 'text-white'}`}>note</h1>
          <ThemeToggle light={light} setLight={setLight} ja={ja} />
        </div>
        <p className={`text-sm mb-5 ${muted}`}>{ja ? `note.com に書いた記事 ${notes.length}本（外部リンク・日本語）` : `${notes.length} posts on note.com (external, Japanese)`}</p>
        <SectionSwitch light={light} />
        <div className="space-y-3">
          {notes.map((n) => (
            <a key={n.id} href={n.url} target="_blank" rel="noopener noreferrer" className={`flex gap-3 rounded-2xl border overflow-hidden transition-colors ${light ? 'bg-white border-zinc-200 hover:border-zinc-400' : 'bg-zinc-800/60 border-zinc-700/50 hover:border-zinc-500'}`}>
              {n.eyecatch && <div className="w-24 sm:w-28 shrink-0 bg-zinc-900"><img src={n.eyecatch} alt="" className="w-full h-full object-cover" loading="lazy" /></div>}
              <div className="py-3 pr-3 min-w-0 flex-1">
                <p className={`text-[11px] ${muted}`}>{n.date}{n.is_paid ? (ja ? ' · 有料記事' : ' · Paid') : ''} · note ↗</p>
                <h2 className={`text-[15px] font-semibold leading-snug mt-0.5 ${light ? 'text-zinc-900' : 'text-white'}`}>{n.title}</h2>
                {n.excerpt && <p className={`text-xs leading-relaxed mt-1 line-clamp-2 ${light ? 'text-zinc-600' : 'text-zinc-400'}`}>{n.excerpt}</p>}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
