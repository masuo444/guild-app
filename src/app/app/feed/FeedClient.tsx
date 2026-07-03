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
  locked: boolean
}

function formatDate(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  } catch {
    return ''
  }
}

export function FeedClient({ posts, isAdmin, userId }: { posts: FeedPost[]; isAdmin: boolean; userId: string }) {
  const { language } = useLanguage()
  const router = useRouter()

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          {language === 'ja' ? 'まっすーフィード' : "MaSU's Feed"}
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          {language === 'ja' ? 'まっすーの日々の投稿。新着はプッシュで届きます。' : "MaSU's daily posts. Get new ones via push."}
        </p>
      </div>

      {isAdmin && <Composer userId={userId} onPosted={() => router.refresh()} />}

      {posts.length === 0 ? (
        <p className="text-center text-zinc-500 py-16 text-sm">
          {language === 'ja' ? 'まだ投稿はありません。' : 'No posts yet.'}
        </p>
      ) : (
        <div className="space-y-5">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} language={language} />
          ))}
        </div>
      )}
    </div>
  )
}

function PostCard({ post, language }: { post: FeedPost; language: string }) {
  return (
    <article className="rounded-2xl bg-zinc-800/60 border border-zinc-700/50 overflow-hidden">
      {post.image_url && (
        <div className="relative w-full aspect-video bg-zinc-900">
          <Image src={post.image_url} alt={post.title} fill className="object-cover" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          {post.is_premium && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-medium">
              {language === 'ja' ? '有料会員限定' : 'Members only'}
            </span>
          )}
          <span className="text-xs text-zinc-500">{formatDate(post.published_at, language)}</span>
        </div>
        <h2 className="text-base font-semibold text-white mb-2">{post.title}</h2>

        {post.locked ? (
          <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
            <div className="text-2xl mb-2">🔒</div>
            <p className="text-sm text-zinc-300 mb-3">
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
          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{post.body}</p>
        )}
      </div>
    </article>
  )
}

function Composer({ userId, onPosted }: { userId: string; onPosted: () => void }) {
  const { language } = useLanguage()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
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
        body: JSON.stringify({ title, body, imageUrl, isPremium, notify }),
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
