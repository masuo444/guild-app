'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generateInviteCode, getInviteMaxUses } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n'

/**
 * 招待リンクをワンタップで共有するカード。
 * 使用上限に達していない reusable 招待コードを自動で用意し、
 * LINE / X / 端末の共有シート / リンクコピー で送れるようにする。
 * 特典（招待した側100pt・された側150pt）は必ず明記して、紹介する動機を作る。
 */
export function InviteShare({ userId, compact = false }: { userId: string; compact?: boolean }) {
  const { language } = useLanguage()
  const ja = language === 'ja'
  const [code, setCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
    const supabase = createClient()
    const load = async () => {
      const { data } = await supabase
        .from('invites')
        .select('code, use_count')
        .eq('invited_by', userId)
        .eq('reusable', true)
        .order('created_at', { ascending: false })
      const list = data ?? []
      const total = list.reduce((s, i) => s + (i.use_count || 0), 0)
      const max = getInviteMaxUses(total)
      const active = list.find((i) => (i.use_count || 0) < max)
      if (active) {
        setCode(active.code)
      } else {
        // 使えるコードが無ければ1つ発行しておく（初回だけ）
        const newCode = generateInviteCode()
        const { data: created } = await supabase
          .from('invites')
          .insert({ code: newCode, invited_by: userId, used: false, membership_type: 'standard', reusable: true })
          .select('code')
          .single()
        if (created) setCode(created.code)
      }
      setLoading(false)
    }
    load()
  }, [userId])

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://guild-app.fomusglobal.com'
  const url = code ? `${origin}/invite/${code}` : ''
  const message = ja
    ? `FOMUS GUILDに招待します🍶\n日本の伝統工芸「枡」から世界とつながる文化コミュニティ。無料で参加できて、この招待からだと150ptの特典つき。\n${url}`
    : `You're invited to FOMUS GUILD 🍶\nA culture community connecting the world through Japanese Masu craft. Free to join, and this invite gives you 150 bonus points.\n${url}`

  const share = async (channel: 'line' | 'x' | 'native' | 'copy') => {
    if (!url) return
    if (channel === 'copy') {
      try { await navigator.clipboard.writeText(url) } catch {}
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      return
    }
    if (channel === 'native') {
      try { await navigator.share({ title: 'FOMUS GUILD', text: message }) } catch {}
      return
    }
    const href = channel === 'line'
      ? `https://line.me/R/msg/text/?${encodeURIComponent(message)}`
      : `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  const btn = 'flex-1 min-w-[96px] inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50'

  return (
    <div className={`rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-teal-500/10 ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl leading-none">🎁</span>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm">
            {ja ? '友達を招待して、ふたりでポイントをもらおう' : 'Invite a friend — you both earn points'}
          </p>
          <p className="text-zinc-300 text-xs mt-1 leading-relaxed">
            {ja
              ? 'あなたに100pt・相手に150pt。無料で参加できます。'
              : 'You get 100pt, they get 150pt. Free to join.'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => share('line')} disabled={loading} className={`${btn} bg-[#06C755] text-white hover:brightness-110`}>
          LINE
        </button>
        <button onClick={() => share('x')} disabled={loading} className={`${btn} bg-black text-white border border-zinc-600 hover:bg-zinc-900`}>
          X
        </button>
        {canNativeShare && (
          <button onClick={() => share('native')} disabled={loading} className={`${btn} bg-white/10 text-white hover:bg-white/20`}>
            {ja ? '共有' : 'Share'}
          </button>
        )}
        <button onClick={() => share('copy')} disabled={loading} className={`${btn} bg-white/10 text-white hover:bg-white/20`}>
          {copied ? (ja ? 'コピーしました' : 'Copied!') : (ja ? 'リンクをコピー' : 'Copy link')}
        </button>
      </div>

      {url && (
        <p className="mt-3 text-[11px] text-zinc-500 truncate">{url}</p>
      )}
    </div>
  )
}
