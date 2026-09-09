'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n'
import { ThemeToggle, useReadingTheme } from '@/app/app/feed/FeedClient'
import { Paywall } from '@/components/feed/Paywall'

interface A { id: number; num: string; date: string; country: string | null; country_en: string | null; title: string; title_en: string | null; body: string; body_en: string | null }
interface N { id: number; title: string; title_en: string | null }

export function ArchiveArticleView({ article, region, teaser, prev, next }: { article: A; region: { key: string; ja: string; en: string; emoji: string }; teaser: boolean; prev: N | null; next: N | null }) {
  const { language } = useLanguage()
  const { light, setLight } = useReadingTheme()
  // 表示言語: 初期値はUIの言語。英語版が無い記事は日本語
  const [lang, setLang] = useState<'ja' | 'en'>('ja')
  useEffect(() => { setLang(language === 'en' && article.body_en ? 'en' : 'ja') }, [language, article.body_en])
  const ja = language === 'ja'
  const showEn = lang === 'en' && !!article.body_en
  const muted = light ? 'text-zinc-500' : 'text-zinc-400'
  const title = showEn && article.title_en ? article.title_en : article.title
  const html = showEn ? article.body_en! : article.body

  const NLink = ({ p, dir }: { p: N | null; dir: 'prev' | 'next' }) => {
    if (!p) return <div className="flex-1" />
    return (
      <Link href={`/app/archive/post/${p.id}`} className={`flex-1 min-w-0 rounded-xl border p-3 transition-colors ${light ? 'border-zinc-200 hover:border-zinc-400' : 'border-zinc-700/60 hover:border-zinc-500'} ${dir === 'next' ? 'text-right' : ''}`}>
        <p className={`text-[11px] ${muted}`}>{dir === 'prev' ? (ja ? '← 前の記事' : '← Previous') : (ja ? '次の記事 →' : 'Next →')}</p>
        <p className={`text-sm font-medium truncate ${light ? 'text-zinc-900' : 'text-white'}`}>{showEn && p.title_en ? p.title_en : p.title}</p>
      </Link>
    )
  }

  return (
    <div className={light ? 'bg-white min-h-screen' : ''}>
      <div className="px-4 md:px-8 pt-4 md:pt-8 pb-28 max-w-[680px] mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6">
          <Link href={`/app/archive/${region.key}`} className={`text-sm ${muted} hover:underline`}>← {region.emoji} {ja ? region.ja : region.en}</Link>
          <div className="flex items-center gap-2">
            {article.body_en && (
              <button onClick={() => setLang(showEn ? 'ja' : 'en')} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${light ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white/10 text-zinc-200 border-zinc-500/40 hover:bg-white/20'}`}>
                {showEn ? '日本語で読む' : 'Read in English'}
              </button>
            )}
            <ThemeToggle light={light} setLight={setLight} ja={ja} />
          </div>
        </div>
        <article>
          <header className="mb-8">
            <p className={`text-xs mb-3 ${muted}`}>#{article.num} · {article.date}{article.country ? ` · ${showEn ? article.country_en || article.country : article.country}` : ''}</p>
            <h1 className={`text-2xl md:text-[28px] font-bold leading-snug ${light ? 'text-zinc-900' : 'text-white'}`}>{title}</h1>
          </header>
          <div className="relative">
            <div className={`archive-body ${light ? 'light text-zinc-800' : 'text-zinc-200'}`} dangerouslySetInnerHTML={{ __html: html }} />
            {teaser && <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t ${light ? 'from-white' : 'from-zinc-900'} to-transparent`} />}
          </div>
          {teaser && <Paywall light={light} ja={ja} returnTo={`/app/archive/post/${article.id}`} />}
          <p className={`mt-12 pt-4 border-t text-[11px] ${light ? 'border-zinc-200 text-zinc-400' : 'border-zinc-700/50 text-zinc-500'}`}>
            {ja ? '© FOMUS / MaSU｜本記事の無断転載・複製・二次利用を禁じます（FOMUS GUILD会員限定コンテンツ）' : '© FOMUS / MaSU｜All rights reserved. Reproduction or redistribution is prohibited (FOMUS GUILD members-only content).'}
          </p>
        </article>
        <nav className="mt-8 flex gap-3"><NLink p={prev} dir="prev" /><NLink p={next} dir="next" /></nav>
      </div>
    </div>
  )
}
