'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/i18n'

interface Comment { id: string; user_id: string; body: string; created_at: string; display_name: string; avatar_url: string | null; mine: boolean }
interface Social { available: boolean; reactions: number; reacted: boolean; comments: Comment[]; isAdmin: boolean }

/** 記事末尾の「🙌 読んだ」とコメント欄（会員限定）。テーブル未作成なら何も出さない */
export function PostSocial({ postId, light }: { postId: string; light: boolean }) {
  const { language } = useLanguage()
  const ja = language === 'ja'
  const [data, setData] = useState<Social | null>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const r = await fetch(`/api/feed/${postId}/social`)
      if (!r.ok) return
      const d = await r.json()
      if (d.available) setData(d)
    } catch {}
  }
  useEffect(() => { load() /* eslint-disable-line react-hooks/exhaustive-deps */ }, [postId])

  if (!data) return null

  const post = async (payload: Record<string, unknown>) => {
    setBusy(true)
    try {
      await fetch(`/api/feed/${postId}/social`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      await load()
    } finally { setBusy(false) }
  }
  const remove = async (id: string) => {
    if (!confirm(ja ? 'このコメントを削除しますか？' : 'Delete this comment?')) return
    await fetch(`/api/feed/${postId}/social?commentId=${id}`, { method: 'DELETE' })
    await load()
  }

  const border = light ? 'border-zinc-200' : 'border-zinc-700/60'
  const muted = light ? 'text-zinc-500' : 'text-zinc-400'
  const textCls = light ? 'text-zinc-800' : 'text-zinc-200'

  return (
    <section className={`mt-10 pt-8 border-t ${border}`}>
      {/* リアクション */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => post({ action: data.reacted ? 'unreact' : 'react' })}
          disabled={busy}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border transition-colors disabled:opacity-50 ${
            data.reacted
              ? 'bg-amber-500 text-zinc-900 border-amber-500'
              : light ? 'bg-white border-zinc-300 text-zinc-800 hover:border-amber-400' : 'bg-white/5 border-zinc-600 text-white hover:border-amber-400'
          }`}
        >
          🙌 {data.reacted ? (ja ? '読んだ！' : 'Read it!') : (ja ? '読んだ' : 'I read this')}
          <span className={`tabular-nums ${data.reacted ? 'text-zinc-900/70' : muted}`}>{data.reactions}</span>
        </button>
      </div>

      {/* コメント */}
      <h3 className={`text-sm font-semibold mb-4 ${light ? 'text-zinc-900' : 'text-white'}`}>
        {ja ? 'コメント' : 'Comments'} <span className={`font-normal ${muted}`}>({data.comments.length})</span>
      </h3>
      <div className="space-y-4 mb-5">
        {data.comments.length === 0 && (
          <p className={`text-sm ${muted}`}>{ja ? 'まだコメントはありません。最初の一言をどうぞ。' : 'No comments yet. Be the first.'}</p>
        )}
        {data.comments.map((m) => (
          <div key={m.id} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden shrink-0">
              {m.avatar_url && <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className={`text-sm font-medium ${light ? 'text-zinc-900' : 'text-white'}`}>{m.display_name}</span>
                <span className={`text-[11px] ${muted}`}>{new Date(m.created_at).toLocaleDateString(ja ? 'ja-JP' : 'en-US', { month: 'short', day: 'numeric' })}</span>
                {(m.mine || data.isAdmin) && (
                  <button onClick={() => remove(m.id)} className={`text-[11px] ${muted} hover:text-red-400`}>{ja ? '削除' : 'Delete'}</button>
                )}
              </div>
              <p className={`text-sm leading-relaxed whitespace-pre-wrap mt-0.5 ${textCls}`}>{m.body}</p>
            </div>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); if (text.trim()) { post({ action: 'comment', text }); setText('') } }}
        className="space-y-2"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder={ja ? '感想や質問をひとこと' : 'Leave a thought or a question'}
          className={`w-full px-3 py-2.5 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-amber-400 ${
            light ? 'bg-white border-zinc-300 text-zinc-900' : 'bg-white/5 border-zinc-600 text-white placeholder-zinc-500'
          }`}
        />
        <div className="flex justify-end">
          <button type="submit" disabled={busy || !text.trim()} className="px-4 py-2 rounded-lg bg-[#c0c0c0] text-zinc-900 text-sm font-medium hover:bg-white transition-colors disabled:opacity-50">
            {ja ? '送信' : 'Post'}
          </button>
        </div>
      </form>
    </section>
  )
}
