'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/i18n'

interface SalesCredit {
  order_id: string
  amount_jpy: number
  points: number
  created_at: string
}

interface SalesData {
  code: string
  totalPoints: number
  totalAmountJpy: number
  history: SalesCredit[]
}

const SHOP_URL = 'https://shop.fomus.jp/shop'

export default function SalesClient() {
  const { t, language } = useLanguage()
  const [data, setData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  useEffect(() => {
    fetch('/api/sales/my-code')
      .then((res) => res.json())
      .then((json) => { if (json.code) setData(json) })
      .finally(() => setLoading(false))
  }, [])

  // 紹介リンク。ショップ側が ?ref= を30日保存して購入時に自動入力する
  const shareUrl = data ? `${SHOP_URL}?ref=${data.code}` : ''

  const copy = async (text: string, which: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(which)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // クリップボードが使えない環境（古いiOS等）では選択してコピーしてもらう
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500 text-sm">{language === 'ja' ? '読み込み中...' : 'Loading...'}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900 px-4 py-8 pb-28 md:pb-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p className="text-[10px] tracking-[0.25em] uppercase text-zinc-500 mb-2">FOMUS GUILD Members</p>
          <h1 className="text-2xl font-light text-white">{t.salesTitle}</h1>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{t.salesIntro}</p>
        </div>

        {data ? (
          <div className="space-y-6">
            {/* 紹介リンク: 共有してもらうのが本命なので最初に置く */}
            <div className="bg-white/5 backdrop-blur rounded-2xl border border-teal-500/20 p-6">
              <p className="text-[10px] tracking-[0.2em] uppercase text-teal-400 mb-3">{t.salesShareTitle}</p>
              <p className="text-sm text-white break-all bg-black/20 rounded-xl px-4 py-3 mb-3 font-mono">{shareUrl}</p>
              <button
                onClick={() => copy(shareUrl, 'link')}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm text-white transition-colors border border-zinc-700/50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5" />
                </svg>
                {copied === 'link' ? t.salesCopied : t.salesCopyLink}
              </button>
              <p className="text-[10px] text-zinc-500 mt-3 leading-relaxed">{t.salesShareNote}</p>
            </div>

            {/* コード単体（口頭・店頭・リンクを貼れない場所向け） */}
            <div className="bg-white/5 backdrop-blur rounded-2xl border border-zinc-700/50 p-6 text-center">
              <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-3">{t.salesYourCode}</p>
              <p className="text-3xl font-light text-white tracking-[0.2em] mb-4">{data.code}</p>
              <button
                onClick={() => copy(data.code, 'code')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm text-white transition-colors border border-zinc-700/50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {copied === 'code' ? t.salesCopied : t.salesCopyCode}
              </button>
              <p className="text-[10px] text-zinc-500 mt-4">{t.salesCodeNote}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur rounded-2xl border border-zinc-700/50 p-5 text-center">
                <p className="text-[10px] tracking-[0.15em] uppercase text-zinc-500 mb-2">{t.salesTotalPoints}</p>
                <p className="text-2xl font-light text-white">{data.totalPoints.toLocaleString()}pt</p>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-2xl border border-zinc-700/50 p-5 text-center">
                <p className="text-[10px] tracking-[0.15em] uppercase text-zinc-500 mb-2">{t.salesTotalAmount}</p>
                <p className="text-2xl font-light text-white">¥{data.totalAmountJpy.toLocaleString()}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-4">{t.salesHistory}</p>
              {data.history.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-zinc-500 text-sm">{t.salesNoHistory}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.history.map((h) => (
                    <div key={h.order_id} className="flex justify-between items-center bg-white/5 backdrop-blur rounded-xl border border-zinc-700/50 px-4 py-3">
                      <div>
                        <p className="text-sm text-white">¥{h.amount_jpy.toLocaleString()}{t.salesPurchase}</p>
                        <p className="text-[10px] text-zinc-500">
                          {new Date(h.created_at).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US')}
                        </p>
                      </div>
                      <p className="text-sm text-teal-400">+{h.points.toLocaleString()}pt</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-white/5 backdrop-blur rounded-2xl border border-zinc-700/50 hover:border-zinc-500/50 transition-colors p-5 text-center"
            >
              <p className="text-sm font-medium text-white mb-1">{t.salesViewShop}</p>
              <div className="mt-2 inline-flex items-center gap-2 text-[10px] tracking-[0.15em] uppercase text-zinc-400">
                <span>shop.fomus.jp</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </div>
            </a>

            {/* ステマ規制（景表法）対策。報酬のある紹介はPR表記が要る */}
            <p className="text-[10px] text-zinc-500 leading-relaxed border-t border-zinc-700/50 pt-4">{t.salesDisclosure}</p>
          </div>
        ) : (
          <p className="text-sm text-red-400 text-center">{t.salesLoadError}</p>
        )}
      </div>
    </div>
  )
}
