'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n'
import { ArticleBody } from '@/components/feed/ArticleBody'
import { FeedEditForm } from '@/components/feed/FeedEditForm'
import { formatPostDate, stripDatePrefix } from '@/lib/feed'
import { ThemeToggle, useReadingTheme } from '../FeedClient'
import { PostSocial } from '@/components/feed/PostSocial'
import { Paywall } from '@/components/feed/Paywall'

export interface ArticlePost {
  id: string
  title: string
  body: string
  image_url: string | null
  is_premium: boolean
  published_at: string
  category: string | null
  minutes: number
  locked: boolean
  teaser: boolean
}
export interface NeighborPost { id: string; title: string; published_at: string }

export function ArticleClient({ post, newer, older, isAdmin, categories }: {
  post: ArticlePost; newer: NeighborPost | null; older: NeighborPost | null; isAdmin: boolean; categories: string[]
}) {
  const { language } = useLanguage()
  const router = useRouter()
  const ja = language === 'ja'
  const { light, setLight } = useReadingTheme()
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)

  const title = stripDatePrefix(post.title)
  const muted = light ? 'text-zinc-500' : 'text-zinc-400'

  const togglePremium = async () => {
    setBusy(true)
    const res = await fetch(`/api/feed/${post.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPremium: !post.is_premium }),
    })
    setBusy(false)
    if (res.ok) router.refresh()
  }
  const remove = async () => {
    if (!confirm(ja ? 'この投稿を削除しますか？' : 'Delete this post?')) return
    const res = await fetch(`/api/feed/${post.id}`, { method: 'DELETE' })
    if (res.ok) router.push('/app/feed')
  }

  const NeighborLink = ({ p, dir }: { p: NeighborPost | null; dir: 'prev' | 'next' }) => {
    if (!p) return <div className="flex-1" />
    return (
      <Link
        href={`/app/feed/${p.id}`}
        className={`flex-1 min-w-0 rounded-xl border p-3 transition-colors ${
          light ? 'border-zinc-200 hover:border-zinc-400' : 'border-zinc-700/60 hover:border-zinc-500'
        } ${dir === 'next' ? 'text-right' : ''}`}
      >
        <p className={`text-[11px] ${muted}`}>
          {dir === 'prev' ? (ja ? '← 前の日' : '← Earlier') : (ja ? '次の日 →' : 'Later →')}
        </p>
        <p className={`text-sm font-medium truncate ${light ? 'text-zinc-900' : 'text-white'}`}>{stripDatePrefix(p.title)}</p>
      </Link>
    )
  }

  return (
    <div className={light ? 'bg-white min-h-screen' : ''}>
      <div className="px-4 md:px-8 pt-4 md:pt-8 pb-28 max-w-[680px] mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6">
          <Link href="/app/feed" className={`text-sm ${muted} hover:underline`}>
            {ja ? '← 活動記録一覧' : '← All posts'}
          </Link>
          <ThemeToggle light={light} setLight={setLight} ja={ja} />
        </div>

        {editing ? (
          <FeedEditForm
            post={{ id: post.id, title: post.title, body: post.body, category: post.category, is_premium: post.is_premium }}
            language={language}
            categories={categories}
            onDone={() => { setEditing(false); router.refresh() }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <article>
            <header className="mb-8">
              <div className={`flex items-center gap-2 flex-wrap text-xs mb-3 ${muted}`}>
                <span>{formatPostDate(post.published_at, language)}</span>
                <span>·</span>
                <span>{ja ? `読了 約${post.minutes}分` : `${post.minutes} min read`}</span>
                {post.category && (
                  <span className={`px-2 py-0.5 rounded-full ${light ? 'bg-zinc-100 text-zinc-600' : 'bg-white/10 text-zinc-300'}`}>{post.category}</span>
                )}
                {post.is_premium && (
                  <span className={`px-2 py-0.5 rounded-full ${light ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/20 text-amber-300'}`}>
                    🔒 {ja ? '有料会員限定' : 'Members only'}
                  </span>
                )}
              </div>
              <h1 className={`text-2xl md:text-[28px] font-bold leading-snug ${light ? 'text-zinc-900' : 'text-white'}`}>{title}</h1>

              {isAdmin && (
                <div className="mt-4 flex items-center gap-3 text-xs">
                  <button onClick={togglePremium} disabled={busy} className={`px-2.5 py-1 rounded-full border transition-colors disabled:opacity-50 ${
                    post.is_premium ? 'border-amber-500/50 text-amber-500 hover:bg-amber-500/10' : 'border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10'
                  }`}>
                    {post.is_premium ? (ja ? '🔒 有料 → 無料にする' : '🔒 Paid → make free') : (ja ? '無料 → 有料にする' : 'Free → make paid')}
                  </button>
                  <button onClick={() => setEditing(true)} className={`${muted} hover:underline`}>{ja ? '編集' : 'Edit'}</button>
                  <button onClick={remove} className="text-red-400/80 hover:text-red-400">{ja ? '削除' : 'Delete'}</button>
                </div>
              )}
            </header>

            {post.image_url && (
              <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-zinc-900 mb-8">
                <Image src={post.image_url} alt={title} fill className="object-cover" priority />
              </div>
            )}

            {post.locked ? (
              <Paywall light={light} ja={ja} returnTo={`/app/feed/${post.id}`} />
            ) : post.teaser ? (
              <>
                <div className="relative">
                  <ArticleBody body={post.body} light={light} />
                  <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t ${light ? 'from-white' : 'from-zinc-900'} to-transparent`} />
                </div>
                <Paywall light={light} ja={ja} returnTo={`/app/feed/${post.id}`} />
              </>
            ) : (
              <>
                <ArticleBody body={post.body} light={light} />
                <PostSocial postId={post.id} light={light} />
              </>
            )}

            <p className={`mt-12 pt-4 border-t text-[11px] ${light ? 'border-zinc-200 text-zinc-400' : 'border-zinc-700/50 text-zinc-500'}`}>
              {ja
                ? '© FOMUS / MaSU｜本記事の無断転載・複製・二次利用を禁じます（FOMUS GUILD会員限定コンテンツ）'
                : '© FOMUS / MaSU｜All rights reserved. Reproduction or redistribution is prohibited (FOMUS GUILD members-only content).'}
            </p>
          </article>
        )}

        <nav className="mt-8 flex gap-3">
          <NeighborLink p={older} dir="prev" />
          <NeighborLink p={newer} dir="next" />
        </nav>
      </div>
    </div>
  )
}
