'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'

interface Q { id: string; body: string; status: 'open' | 'answered'; answer_post_id: string | null; created_at: string }

/** マイページ「まっすーに質問」。会員限定。質問は記事で答える */
export function QuestionBox() {
  const { language } = useLanguage()
  const ja = language === 'ja'
  const [available, setAvailable] = useState(false)
  const [items, setItems] = useState<Q[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const load = async () => {
    try {
      const r = await fetch('/api/questions')
      if (!r.ok) return
      const d = await r.json()
      if (d.available) { setAvailable(true); setItems(d.questions) }
    } catch {}
  }
  useEffect(() => { load() }, [])
  if (!available) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setBusy(true)
    try {
      const r = await fetch('/api/questions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      if (r.ok) { setText(''); setDone(true); setTimeout(() => setDone(false), 4000); await load() }
    } finally { setBusy(false) }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold text-white">{ja ? 'まっすーに質問' : 'Ask MaSU'}</h2>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-zinc-400 mb-4">
          {ja ? '気になることを送ってください。答えは記事の中でお返しします（名前は出しません）。' : 'Send your question. MaSU answers in a post (your name is not shown).'}
        </p>
        <form onSubmit={submit} className="space-y-2">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={2000}
            placeholder={ja ? '例：移住してから一番困ったことは？' : 'e.g. What was the hardest part after moving?'}
            className="w-full px-3 py-2.5 rounded-lg text-sm bg-white/5 border border-zinc-600 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-400" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-green-400">{done ? (ja ? '送信しました' : 'Sent!') : ''}</span>
            <button type="submit" disabled={busy || !text.trim()} className="px-4 py-2 rounded-lg bg-[#c0c0c0] text-zinc-900 text-sm font-medium hover:bg-white transition-colors disabled:opacity-50">
              {ja ? '送る' : 'Send'}
            </button>
          </div>
        </form>
        {items.length > 0 && (
          <ul className="mt-5 space-y-2 border-t border-zinc-700/50 pt-4">
            {items.map((q) => (
              <li key={q.id} className="text-sm">
                <span className={`inline-block mr-2 px-2 py-0.5 rounded-full text-[11px] ${q.status === 'answered' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-zinc-300'}`}>
                  {q.status === 'answered' ? (ja ? '回答済み' : 'Answered') : (ja ? '受付中' : 'Open')}
                </span>
                <span className="text-zinc-300">{q.body.length > 60 ? q.body.slice(0, 60) + '…' : q.body}</span>
                {q.answer_post_id && (
                  <Link href={`/app/feed/${q.answer_post_id}`} className="ml-2 text-amber-300 hover:underline text-xs">{ja ? '記事を読む →' : 'Read →'}</Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
