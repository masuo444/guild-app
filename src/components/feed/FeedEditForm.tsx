'use client'

import { useState } from 'react'

export interface EditablePost {
  id: string
  title: string
  body: string
  category: string | null
  is_premium: boolean
}

/** 投稿の編集フォーム（管理者用）。記事ページとフィードの両方から使う */
export function FeedEditForm({ post, language, categories, onDone, onCancel }: {
  post: EditablePost
  language: string
  categories: string[]
  onDone: () => void
  onCancel: () => void
}) {
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

  const input = 'w-full px-3 py-2.5 bg-white/5 border border-zinc-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]'

  return (
    <div className="rounded-2xl bg-zinc-800/80 border border-[#c0c0c0]/40 p-5 space-y-3">
      <p className="text-xs text-zinc-400">{ja ? '投稿を編集' : 'Edit post'}</p>
      <input type="text" list="feed-categories" value={category} onChange={(e) => setCategory(e.target.value)} placeholder={ja ? '枠組み（例: 笛吹市活動記録）' : 'Category'} className={input} />
      <datalist id="feed-categories">
        {categories.map((c) => <option key={c} value={c} />)}
      </datalist>
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={input} />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={18} className={`${input} resize-y leading-relaxed`} />
      <label className="inline-flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
        <input type="checkbox" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} />
        {ja ? '有料会員限定' : 'Members only'}
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 bg-[#c0c0c0] text-zinc-900 rounded-lg text-sm font-medium hover:bg-white transition-colors disabled:opacity-50">
          {saving ? (ja ? '保存中…' : 'Saving…') : (ja ? '保存' : 'Save')}
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 text-zinc-400 text-sm hover:text-white transition-colors">
          {ja ? 'キャンセル' : 'Cancel'}
        </button>
      </div>
    </div>
  )
}
