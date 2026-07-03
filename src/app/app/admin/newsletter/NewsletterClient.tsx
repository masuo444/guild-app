'use client'

import { useState } from 'react'
import Link from 'next/link'

export function NewsletterClient({ initialMultiplier, initialUntil }: { initialMultiplier: number; initialUntil: string }) {
  // --- メルマガ作成 ---
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [previewEn, setPreviewEn] = useState<{ subject: string; body: string } | null>(null)
  const [translating, setTranslating] = useState(false)
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // --- ログインボーナス2倍 ---
  const [multiplier, setMultiplier] = useState(initialMultiplier)
  const [until, setUntil] = useState(initialUntil)
  const [savingCampaign, setSavingCampaign] = useState(false)
  const [campaignMsg, setCampaignMsg] = useState('')

  const previewTranslate = async () => {
    if (!subject.trim() && !body.trim()) return
    setTranslating(true)
    try {
      const [s, b] = await Promise.all([
        fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: subject, from: 'ja', to: 'en' }) }).then(r => r.json()),
        fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: body, from: 'ja', to: 'en' }) }).then(r => r.json()),
      ])
      setPreviewEn({ subject: s.translated || subject, body: b.translated || body })
    } catch {
      setMsg({ type: 'err', text: '英訳プレビューに失敗しました' })
    } finally {
      setTranslating(false)
    }
  }

  const send = async (test: boolean) => {
    if (!subject.trim() || !body.trim()) {
      setMsg({ type: 'err', text: '件名と本文を入力してください' })
      return
    }
    if (!test && !confirm('全会員にメルマガを送信します。よろしいですか？')) return
    setSending(true)
    setMsg(null)
    try {
      const res = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body, test }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed')
      setMsg({
        type: 'ok',
        text: test
          ? `テスト送信しました（自分宛）。メール ${d.emailSent}件 / プッシュ ${d.pushSent}件`
          : `全員に送信しました。メール ${d.emailSent}件（失敗${d.emailFailed}）/ プッシュ ${d.pushSent}件`,
      })
    } catch (e) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : '送信に失敗しました' })
    } finally {
      setSending(false)
    }
  }

  const saveCampaign = async () => {
    setSavingCampaign(true)
    setCampaignMsg('')
    try {
      const res = await fetch('/api/admin/login-bonus-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ multiplier, until: until || null }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed')
      setCampaignMsg(d.effective > 1 ? `保存しました（現在 ${d.effective}倍が有効）` : '保存しました（通常＝1倍）')
    } catch (e) {
      setCampaignMsg(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setSavingCampaign(false)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto pb-24 text-zinc-100">
      <div className="mb-6">
        <Link href="/app/admin" className="text-xs text-zinc-400 hover:text-white">← 管理画面へ戻る</Link>
        <h1 className="text-2xl font-bold text-white mt-2">週刊メルマガ</h1>
        <p className="text-sm text-zinc-400 mt-1">日本語で書けば、英語ユーザーには自動で英訳して送ります。メールは全会員に、プッシュは通知ONの会員に届きます。</p>
      </div>

      {/* ログインボーナス2倍キャンペーン */}
      <div className="mb-8 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 p-5">
        <h2 className="font-semibold text-white mb-1">ログインボーナス倍率</h2>
        <p className="text-xs text-zinc-400 mb-3">キャンペーン中は毎日のログインボーナスが倍率分に。メルマガで告知してログインを促しましょう。</p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="block text-zinc-400 text-xs mb-1">倍率</span>
            <select value={multiplier} onChange={(e) => setMultiplier(Number(e.target.value))} className="px-3 py-2 bg-white/5 border border-zinc-600 rounded-lg text-white text-sm">
              <option value={1}>通常（1倍・10pt）</option>
              <option value={2}>2倍（20pt）</option>
              <option value={3}>3倍（30pt）</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="block text-zinc-400 text-xs mb-1">期限（この日まで有効・空欄で無期限）</span>
            <input type="date" value={until} onChange={(e) => setUntil(e.target.value)} className="px-3 py-2 bg-white/5 border border-zinc-600 rounded-lg text-white text-sm" />
          </label>
          <button onClick={saveCampaign} disabled={savingCampaign} className="px-4 py-2 bg-[#c0c0c0] text-zinc-900 rounded-lg text-sm font-medium hover:bg-white transition-colors disabled:opacity-50">
            {savingCampaign ? '保存中…' : '保存'}
          </button>
        </div>
        {campaignMsg && <p className="text-xs text-emerald-400 mt-2">{campaignMsg}</p>}
      </div>

      {/* メルマガ作成 */}
      <div className="rounded-2xl bg-zinc-800/60 border border-zinc-700/50 p-5 space-y-3">
        <h2 className="font-semibold text-white">メルマガを書く（日本語）</h2>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="件名（例: 今週のFOMUS GUILD／ログインボーナス2倍キャンペーン中！）"
          className="w-full px-3 py-2.5 bg-white/5 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#c0c0c0]"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="本文…（今週のトピック、新着記事、キャンペーン告知など）"
          rows={10}
          className="w-full px-3 py-2.5 bg-white/5 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#c0c0c0] resize-y"
        />

        <div className="flex flex-wrap gap-2">
          <button onClick={previewTranslate} disabled={translating} className="px-4 py-2 border border-zinc-600 text-zinc-200 rounded-lg text-sm hover:bg-white/5 disabled:opacity-50">
            {translating ? '英訳中…' : '英訳プレビュー'}
          </button>
          <button onClick={() => send(true)} disabled={sending} className="px-4 py-2 border border-[#c0c0c0]/50 text-[#e5e5e5] rounded-lg text-sm hover:bg-white/5 disabled:opacity-50">
            {sending ? '送信中…' : '自分にテスト送信'}
          </button>
          <button onClick={() => send(false)} disabled={sending} className="px-4 py-2 bg-[#c0c0c0] text-zinc-900 rounded-lg text-sm font-medium hover:bg-white transition-colors disabled:opacity-50">
            {sending ? '送信中…' : '全員に送信'}
          </button>
        </div>

        {msg && <p className={`text-sm ${msg.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p>}

        {previewEn && (
          <div className="mt-2 rounded-xl border border-zinc-700/50 bg-white/5 p-4">
            <p className="text-xs text-zinc-400 mb-2">英語版プレビュー（English preview）</p>
            <p className="text-sm font-semibold text-white mb-1">{previewEn.subject}</p>
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{previewEn.body}</p>
          </div>
        )}
      </div>
    </div>
  )
}
