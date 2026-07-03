'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import { compressAndCropImage } from '@/lib/imageUtils'

export interface FeedPost {
  id: string
  title: string
  body: string
  image_url: string | null
  is_premium: boolean
  published_at: string
  category: string | null
  locked: boolean
}

const DEFAULT_CATEGORY = '笛吹市活動記録'

function formatDate(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  } catch {
    return ''
  }
}

export function FeedClient({ posts, categories, isAdmin, userId }: { posts: FeedPost[]; categories: string[]; isAdmin: boolean; userId: string }) {
  const { language } = useLanguage()
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [light, setLight] = useState(false)
  const ja = language === 'ja'

  const visiblePosts = activeCategory
    ? posts.filter((p) => p.category === activeCategory)
    : posts

  const chipInactive = light ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200' : 'bg-white/5 text-zinc-300 hover:bg-white/10'

  return (
    <div className={light ? 'bg-white min-h-screen' : ''}>
      <div className="p-4 md:p-8 max-w-2xl mx-auto pb-24">
        <div className="mb-4">
          <div className="flex items-start justify-between gap-3">
            <h1 className={`text-2xl font-bold ${light ? 'text-zinc-900' : 'text-white'}`}>
              {ja ? 'まっすーフィード' : "MaSU's Feed"}
            </h1>
            {/* 表示テーマ切替（白背景/ダーク） */}
            <button
              onClick={() => setLight((v) => !v)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                light
                  ? 'bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-700'
                  : 'bg-white/10 text-zinc-200 border-zinc-500/40 hover:bg-white/20'
              }`}
              aria-label="Toggle reading theme"
            >
              {light ? (ja ? '🌙 ダーク' : '🌙 Dark') : (ja ? '☀️ 白背景' : '☀️ Light')}
            </button>
          </div>
          <p className={`text-sm mt-1 ${light ? 'text-zinc-600' : 'text-zinc-400'}`}>
            {ja ? 'まっすーの日々の投稿。新着はプッシュで届きます。' : "MaSU's daily posts. Get new ones via push."}
          </p>
          <p className={`text-xs mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border ${
            light ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-amber-300/80 bg-amber-500/10 border-amber-500/20'
          }`}>
            <span>🔒</span>
            {ja
              ? '会員限定コンテンツです。記事の無断転載・SNS等への再掲を禁じます。'
              : 'Members-only content. Reproduction or reposting (incl. social media) is prohibited.'}
          </p>
        </div>

        {/* 枠組み（カテゴリー）フィルター */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeCategory === null ? 'bg-[#c0c0c0] text-zinc-900' : chipInactive
              }`}
            >
              {ja ? 'すべて' : 'All'}
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === c ? 'bg-[#c0c0c0] text-zinc-900' : chipInactive
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {isAdmin && <Composer userId={userId} categories={categories} onPosted={() => router.refresh()} />}

        {visiblePosts.length === 0 ? (
          <p className="text-center text-zinc-500 py-16 text-sm">
            {ja ? 'まだ投稿はありません。' : 'No posts yet.'}
          </p>
        ) : (
          <div className="space-y-5">
            {visiblePosts.map((post) => (
              <PostCard key={post.id} post={post} language={language} isAdmin={isAdmin} categories={categories} light={light} onChanged={() => router.refresh()} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PostCard({ post, language, isAdmin, categories, light, onChanged }: { post: FeedPost; language: string; isAdmin: boolean; categories: string[]; light: boolean; onChanged: () => void }) {
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const ja = language === 'ja'

  if (editing) {
    return <EditForm post={post} language={language} categories={categories} onDone={() => { setEditing(false); onChanged() }} onCancel={() => setEditing(false)} />
  }

  // 無料/有料をワンタップで切り替え（管理者のみ）
  const togglePremium = async () => {
    setBusy(true)
    const res = await fetch(`/api/feed/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPremium: !post.is_premium }),
    })
    setBusy(false)
    if (res.ok) onChanged()
  }

  return (
    <article className={`rounded-2xl overflow-hidden border ${light ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-800/60 border-zinc-700/50'}`}>
      {post.image_url && (
        <div className="relative w-full aspect-video bg-zinc-900">
          <Image src={post.image_url} alt={post.title} fill className="object-cover" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {post.category && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${light ? 'bg-zinc-100 text-zinc-700' : 'bg-[#c0c0c0]/20 text-[#e5e5e5]'}`}>
              {post.category}
            </span>
          )}
          {post.is_premium && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${light ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/20 text-amber-300'}`}>
              {language === 'ja' ? '有料会員限定' : 'Members only'}
            </span>
          )}
          <span className="text-xs text-zinc-500">{formatDate(post.published_at, language)}</span>
          {isAdmin && (
            <span className="ml-auto flex items-center gap-2">
              <button
                onClick={togglePremium}
                disabled={busy}
                className={`text-xs px-2 py-0.5 rounded-full border transition-colors disabled:opacity-50 ${
                  post.is_premium
                    ? 'border-amber-500/50 text-amber-500 hover:bg-amber-500/10'
                    : 'border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10'
                }`}
                title={ja ? 'クリックで無料/有料を切替' : 'Toggle free/paid'}
              >
                {post.is_premium ? (ja ? '🔒 有料' : '🔒 Paid') : (ja ? '無料' : 'Free')}
              </button>
              <button onClick={() => setEditing(true)} className={`text-xs transition-colors ${light ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-400 hover:text-white'}`}>
                {ja ? '編集' : 'Edit'}
              </button>
              <button
                onClick={async () => {
                  if (!confirm(ja ? 'この投稿を削除しますか？' : 'Delete this post?')) return
                  const res = await fetch(`/api/feed/${post.id}`, { method: 'DELETE' })
                  if (res.ok) onChanged()
                }}
                className="text-xs text-red-400/80 hover:text-red-400 transition-colors"
              >
                {ja ? '削除' : 'Delete'}
              </button>
            </span>
          )}
        </div>
        <h2 className={`text-base font-semibold mb-2 ${light ? 'text-zinc-900' : 'text-white'}`}>{post.title}</h2>

        {post.locked ? (
          <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
            <div className="text-2xl mb-2">🔒</div>
            <p className={`text-sm mb-3 ${light ? 'text-zinc-600' : 'text-zinc-300'}`}>
              {language === 'ja'
                ? 'この投稿は有料会員限定です。'
                : 'This post is for paid members.'}
            </p>
            <Link
              href="/auth/subscribe"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-[#c0c0c0] text-zinc-900 rounded-lg text-sm font-medium hover:bg-white transition-colors"
            >
              {language === 'ja' ? 'アップグレードして読む' : 'Upgrade to read'}
            </Link>
          </div>
        ) : (
          <>
            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${light ? 'text-zinc-800' : 'text-zinc-300'}`}>{post.body}</p>
            <p className={`mt-4 pt-3 border-t text-[11px] ${light ? 'border-zinc-200 text-zinc-400' : 'border-zinc-700/50 text-zinc-500'}`}>
              {ja
                ? '© FOMUS / MaSU｜本記事の無断転載・複製・二次利用を禁じます（FOMUS GUILD会員限定コンテンツ）'
                : '© FOMUS / MaSU｜All rights reserved. Reproduction or redistribution is prohibited (FOMUS GUILD members-only content).'}
            </p>
          </>
        )}
      </div>
    </article>
  )
}

function EditForm({ post, language, categories, onDone, onCancel }: { post: FeedPost; language: string; categories: string[]; onDone: () => void; onCancel: () => void }) {
  const ja = language === 'ja'
  const [title, setTitle] = useState(post.title)
  const [body, setBody] = useState(post.body)
  const [category, setCategory] = useState(post.category ?? '')
  const [isPremium, setIsPremium] = useState(post.is_premium)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) {
      setError(ja ? 'タイトルと本文を入力してください' : 'Title and body are required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/feed/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, category: category.trim() || null, isPremium }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed')
      }
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl bg-zinc-800/80 border border-[#c0c0c0]/40 p-5 space-y-3">
      <p className="text-xs text-zinc-400">{ja ? '投稿を編集' : 'Edit post'}</p>
      <input
        type="text"
        list="feed-categories"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder={ja ? '枠組み（例: 笛吹市活動記録）' : 'Category'}
        className="w-full px-3 py-2.5 bg-white/5 border border-zinc-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
      />
      <datalist id="feed-categories">
        {categories.map((c) => <option key={c} value={c} />)}
      </datalist>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-3 py-2.5 bg-white/5 border border-zinc-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={10}
        className="w-full px-3 py-2.5 bg-white/5 border border-zinc-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#c0c0c0] resize-y"
      />
      <label className="inline-flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
        <input type="checkbox" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} />
        {ja ? '有料会員限定' : 'Members only'}
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 px-4 py-2.5 bg-[#c0c0c0] text-zinc-900 rounded-lg text-sm font-medium hover:bg-white transition-colors disabled:opacity-50"
        >
          {saving ? (ja ? '保存中…' : 'Saving…') : (ja ? '保存' : 'Save')}
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 text-zinc-400 text-sm hover:text-white transition-colors">
          {ja ? 'キャンセル' : 'Cancel'}
        </button>
      </div>
    </div>
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
      // 既存アバターと同じ avatars/ フォルダ配下に置く
      // （ストレージRLSがフォルダ単位で許可している場合でも確実に通す）
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
        className="w-full mb-6 px-4 py-3 rounded-xl border border-dashed border-zinc-600 text-zinc-300 text-sm font-medium hover:bg-white/5 transition-colors"
      >
        {ja ? '＋ 新しい投稿を書く' : '+ Write a new post'}
      </button>
    )
  }

  return (
    <div className="mb-6 rounded-2xl bg-zinc-800/80 border border-zinc-700 p-5 space-y-3">
      <input
        type="text"
        list="feed-categories-composer"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder={ja ? '枠組み（例: 笛吹市活動記録）' : 'Category'}
        className="w-full px-3 py-2.5 bg-white/5 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
      />
      <datalist id="feed-categories-composer">
        {categories.map((c) => <option key={c} value={c} />)}
        {!categories.includes(DEFAULT_CATEGORY) && <option value={DEFAULT_CATEGORY} />}
      </datalist>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={ja ? 'タイトル（一言）' : 'Title (one line)'}
        className="w-full px-3 py-2.5 bg-white/5 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={ja ? '本文…' : 'Body…'}
        rows={4}
        className="w-full px-3 py-2.5 bg-white/5 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#c0c0c0] resize-y"
      />

      {imageUrl && (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-zinc-900">
          <Image src={imageUrl} alt="preview" fill className="object-cover" />
          <button
            onClick={() => setImageUrl(null)}
            className="absolute top-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded"
          >
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
          {ja ? 'プッシュ通知を送る' : 'Send push'}
        </label>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSubmit}
          disabled={submitting || uploading}
          className="flex-1 px-4 py-2.5 bg-[#c0c0c0] text-zinc-900 rounded-lg text-sm font-medium hover:bg-white transition-colors disabled:opacity-50"
        >
          {submitting ? (ja ? '投稿中…' : 'Posting…') : (ja ? '投稿する' : 'Post')}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="px-4 py-2.5 text-zinc-400 text-sm hover:text-white transition-colors"
        >
          {ja ? 'キャンセル' : 'Cancel'}
        </button>
      </div>
    </div>
  )
}
