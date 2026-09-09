'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import { compressAndCropImage } from '@/lib/imageUtils'
import { formatMonth, formatPostDate, monthKey, stripDatePrefix } from '@/lib/feed'
import { SectionSwitch } from '@/components/archive/SectionSwitch'

export interface FeedListItem {
  id: string
  title: string
  excerpt: string
  minutes: number
  image_url: string | null
  is_premium: boolean
  published_at: string
  category: string | null
  locked: boolean
}

const DEFAULT_CATEGORY = '笛吹市活動記録'
const LIGHT_KEY = 'fomus-feed-light'

export function useReadingTheme() {
  const [light, setLightState] = useState(false)
  useEffect(() => {
    try { setLightState(localStorage.getItem(LIGHT_KEY) === '1') } catch {}
  }, [])
  const setLight = (v: boolean) => {
    setLightState(v)
    try { localStorage.setItem(LIGHT_KEY, v ? '1' : '0') } catch {}
  }
  return { light, setLight }
}

export function ThemeToggle({ light, setLight, ja }: { light: boolean; setLight: (v: boolean) => void; ja: boolean }) {
  return (
    <button
      onClick={() => setLight(!light)}
      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        light
          ? 'bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-700'
          : 'bg-white/10 text-zinc-200 border-zinc-500/40 hover:bg-white/20'
      }`}
      aria-label="Toggle reading theme"
    >
      {light ? (ja ? '🌙 ダーク' : '🌙 Dark') : (ja ? '☀️ 白背景' : '☀️ Light')}
    </button>
  )
}

export function FeedClient({ posts, categories, isAdmin, userId, needsLocation = false }: { posts: FeedListItem[]; categories: string[]; isAdmin: boolean; userId: string; needsLocation?: boolean }) {
  const { language } = useLanguage()
  const router = useRouter()
  const ja = language === 'ja'
  const { light, setLight } = useReadingTheme()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeMonth, setActiveMonth] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [matchIds, setMatchIds] = useState<Set<string> | null>(null)
  const [mapPromptHidden, setMapPromptHidden] = useState(false)
  useEffect(() => { try { setMapPromptHidden(localStorage.getItem('fomus-map-prompt-hidden') === '1') } catch {} }, [])

  // キーワード検索（タイトル・本文）。入力が止まって300ms後にサーバーへ
  useEffect(() => {
    const q = query.trim()
    if (!q) { setMatchIds(null); return }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/feed/search?q=${encodeURIComponent(q)}`)
        const d = await r.json()
        setMatchIds(new Set<string>(d.ids ?? []))
      } catch { setMatchIds(new Set()) }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  // 月別アーカイブ（新しい月が先）
  const months = useMemo(
    () => Array.from(new Set(posts.map((p) => monthKey(p.published_at)))).sort().reverse(),
    [posts]
  )

  const visible = posts.filter(
    (p) => (!activeCategory || p.category === activeCategory) && (!activeMonth || monthKey(p.published_at) === activeMonth) && (!matchIds || matchIds.has(p.id))
  )

  const chipActive = 'bg-[#c0c0c0] text-zinc-900'
  const chipInactive = light ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200' : 'bg-white/5 text-zinc-300 hover:bg-white/10'
  const chip = (on: boolean) => `px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${on ? chipActive : chipInactive}`

  return (
    <div className={light ? 'bg-white min-h-screen' : ''}>
      <div className="p-4 md:p-8 max-w-2xl mx-auto pb-24">
        <div className="mb-5">
          <div className="flex items-start justify-between gap-3">
            <h1 className={`text-2xl font-bold ${light ? 'text-zinc-900' : 'text-white'}`}>
              {ja ? 'まっすー活動記録' : "MaSU's Journal"}
            </h1>
            <ThemeToggle light={light} setLight={setLight} ja={ja} />
          </div>
          <p className={`text-sm mt-1 ${light ? 'text-zinc-600' : 'text-zinc-400'}`}>
            {ja
              ? `笛吹市での日々をほぼ毎日。全${posts.length}本。`
              : `Almost daily notes from Fuefuki. ${posts.length} posts.`}
          </p>
        </div>

        <SectionSwitch light={light} />

        {/* マップに載る導線（位置未設定の会員だけ・閉じられる） */}
        {needsLocation && !mapPromptHidden && (
          <div className={`mb-4 flex items-start gap-3 rounded-xl border p-3.5 ${light ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/25'}`}>
            <span className="text-xl leading-none">🗺️</span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${light ? 'text-emerald-900' : 'text-emerald-200'}`}>
                {ja ? 'マップに自分を置きましょう' : 'Put yourself on the map'}
              </p>
              <p className={`text-xs mt-0.5 ${light ? 'text-emerald-800/80' : 'text-emerald-100/70'}`}>
                {ja ? '国と都市を登録すると、世界のメンバーからあなたが見つかります。' : 'Add your country and city so members around the world can find you.'}
              </p>
              <Link href="/app/profile#location" className={`inline-block mt-2 text-xs font-medium underline underline-offset-2 ${light ? 'text-emerald-800' : 'text-emerald-200'}`}>
                {ja ? '位置を設定する →' : 'Set my location →'}
              </Link>
            </div>
            <button onClick={() => { setMapPromptHidden(true); try { localStorage.setItem('fomus-map-prompt-hidden', '1') } catch {} }} className={`text-xs ${light ? 'text-emerald-700' : 'text-emerald-200/70'}`} aria-label="close">✕</button>
          </div>
        )}

        {/* 検索 */}
        <div className="mb-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ja ? '記事を検索（例：ワイナリー、補助金）' : 'Search posts'}
            className={`w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[#c0c0c0] ${
              light ? 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400' : 'bg-white/5 border-zinc-700 text-white placeholder-zinc-500'
            }`}
          />
          {matchIds && (
            <p className={`text-xs mt-1.5 ${light ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {ja ? `${visible.length}件が一致` : `${visible.length} match${visible.length === 1 ? '' : 'es'}`}
            </p>
          )}
        </div>

        {/* 月別アーカイブ */}
        {months.length > 1 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 -mx-1 px-1">
            <button onClick={() => setActiveMonth(null)} className={`${chip(activeMonth === null)} whitespace-nowrap`}>
              {ja ? 'すべて' : 'All'}
            </button>
            {months.map((m) => (
              <button key={m} onClick={() => setActiveMonth(m)} className={`${chip(activeMonth === m)} whitespace-nowrap`}>
                {formatMonth(m, language)}
              </button>
            ))}
          </div>
        )}

        {/* 枠組み（カテゴリー）は2つ以上ある時だけ表示 */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => setActiveCategory(null)} className={chip(activeCategory === null)}>
              {ja ? '全ジャンル' : 'All topics'}
            </button>
            {categories.map((c) => (
              <button key={c} onClick={() => setActiveCategory(c)} className={chip(activeCategory === c)}>{c}</button>
            ))}
          </div>
        )}

        {isAdmin && <Composer userId={userId} categories={categories} onPosted={() => router.refresh()} />}

        {visible.length === 0 ? (
          <p className="text-center text-zinc-500 py-16 text-sm">
            {ja ? 'まだ投稿はありません。' : 'No posts yet.'}
          </p>
        ) : (
          <div className="space-y-3">
            {visible.map((post) => (
              <PostCard key={post.id} post={post} language={language} light={light} />
            ))}
          </div>
        )}

        <p className={`mt-10 text-[11px] text-center ${light ? 'text-zinc-400' : 'text-zinc-600'}`}>
          {ja
            ? '会員限定コンテンツです。記事の無断転載・SNS等への再掲を禁じます。'
            : 'Members-only content. Reproduction or reposting is prohibited.'}
        </p>
      </div>
    </div>
  )
}

function PostCard({ post, language, light }: { post: FeedListItem; language: string; light: boolean }) {
  const ja = language === 'ja'
  const title = stripDatePrefix(post.title)
  return (
    <Link
      href={`/app/feed/${post.id}`}
      className={`block rounded-2xl overflow-hidden border transition-colors ${
        light ? 'bg-white border-zinc-200 hover:border-zinc-400 shadow-sm' : 'bg-zinc-800/60 border-zinc-700/50 hover:border-zinc-500'
      }`}
    >
      {post.image_url && (
        <div className="relative w-full aspect-[2/1] bg-zinc-900">
          <Image src={post.image_url} alt={title} fill className="object-cover" />
        </div>
      )}
      <div className="p-4 md:p-5">
        <div className="flex items-center gap-2 flex-wrap text-xs mb-1.5">
          <span className={light ? 'text-zinc-500' : 'text-zinc-400'}>{formatPostDate(post.published_at, language)}</span>
          <span className={light ? 'text-zinc-400' : 'text-zinc-600'}>·</span>
          <span className={light ? 'text-zinc-500' : 'text-zinc-400'}>{ja ? `約${post.minutes}分` : `${post.minutes} min`}</span>
          {post.is_premium && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${light ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/20 text-amber-300'}`}>
              🔒 {ja ? '有料会員限定' : 'Members only'}
            </span>
          )}
        </div>
        <h2 className={`text-base md:text-[17px] font-bold leading-snug ${light ? 'text-zinc-900' : 'text-white'}`}>{title}</h2>
        {post.locked ? (
          <p className={`mt-2 text-sm ${light ? 'text-zinc-500' : 'text-zinc-400'}`}>
            {ja ? '有料会員になると読めます →' : 'Upgrade to read →'}
          </p>
        ) : post.excerpt ? (
          <p className={`mt-2 text-sm leading-relaxed line-clamp-2 ${light ? 'text-zinc-600' : 'text-zinc-400'}`}>{post.excerpt}</p>
        ) : null}
      </div>
    </Link>
  )
}

function Composer({ userId, categories, onPosted }: { userId: string; categories: string[]; onPosted: () => void }) {
  const { language } = useLanguage()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState(categories[0] ?? DEFAULT_CATEGORY)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [notify, setNotify] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const ja = language === 'ja'

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const blob = await compressAndCropImage(file, { maxSize: 1200, quality: 0.85, maxFileSize: 800 * 1024 })
      const supabase = createClient()
      // 既存アバターと同じ avatars/ フォルダ配下に置く（ストレージRLSの許可範囲内）
      const filePath = `avatars/feed-${userId}-${Date.now()}.jpg`
      const { error: upErr } = await supabase.storage.from('avatars').upload(filePath, blob, {
        contentType: 'image/jpeg', upsert: true,
      })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setImageUrl(publicUrl)
    } catch (err) {
      console.error(err)
      setError(ja ? '画像のアップロードに失敗しました' : 'Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      setError(ja ? 'タイトルと本文を入力してください' : 'Title and body are required')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/feed/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, category: category.trim() || null, imageUrl, isPremium, notify }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed')
      }
      setTitle(''); setBody(''); setImageUrl(null); setIsPremium(false); setNotify(true); setOpen(false)
      onPosted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full mb-5 px-4 py-3 rounded-xl border border-dashed border-zinc-600 text-zinc-300 text-sm font-medium hover:bg-white/5 transition-colors"
      >
        {ja ? '＋ 新しい投稿を書く' : '+ Write a new post'}
      </button>
    )
  }

  const input = 'w-full px-3 py-2.5 bg-white/5 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]'

  return (
    <div className="mb-6 rounded-2xl bg-zinc-800/80 border border-zinc-700 p-5 space-y-3">
      <input type="text" list="feed-categories-composer" value={category} onChange={(e) => setCategory(e.target.value)} placeholder={ja ? '枠組み（例: 笛吹市活動記録）' : 'Category'} className={input} />
      <datalist id="feed-categories-composer">
        {categories.map((c) => <option key={c} value={c} />)}
        {!categories.includes(DEFAULT_CATEGORY) && <option value={DEFAULT_CATEGORY} />}
      </datalist>
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={ja ? 'タイトル（一言）' : 'Title (one line)'} className={input} />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={ja ? '本文…（1行目に「2026年9月7日。」、絵文字で始まる行は見出し、「💡 学び：」は学びカードになります）' : 'Body…'} rows={8} className={`${input} resize-y leading-relaxed`} />

      {imageUrl && (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-zinc-900">
          <Image src={imageUrl} alt="preview" fill className="object-cover" />
          <button onClick={() => setImageUrl(null)} className="absolute top-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
            {ja ? '削除' : 'Remove'}
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-600 text-zinc-300 text-sm cursor-pointer hover:bg-white/5">
          {uploading ? (ja ? 'アップロード中…' : 'Uploading…') : (ja ? '📷 写真を追加' : '📷 Add photo')}
          <input type="file" accept="image/*" onChange={handleImage} disabled={uploading} className="hidden" />
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
          <input type="checkbox" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} />
          {ja ? '有料会員限定' : 'Members only'}
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
          {ja ? '会員にメールで配信する' : 'Email members'}
        </label>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button onClick={handleSubmit} disabled={submitting || uploading} className="flex-1 px-4 py-2.5 bg-[#c0c0c0] text-zinc-900 rounded-lg text-sm font-medium hover:bg-white transition-colors disabled:opacity-50">
          {submitting ? (ja ? '投稿中…' : 'Posting…') : (ja ? '投稿する' : 'Post')}
        </button>
        <button onClick={() => setOpen(false)} className="px-4 py-2.5 text-zinc-400 text-sm hover:text-white transition-colors">
          {ja ? 'キャンセル' : 'Cancel'}
        </button>
      </div>
    </div>
  )
}
