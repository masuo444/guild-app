'use client'

import { useState, useEffect } from 'react'

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

export default function SalesClient() {
  const [data, setData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/sales/my-code')
      .then((res) => res.json())
      .then((json) => {
        if (json.code) setData(json)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleCopy = () => {
    if (!data) return
    navigator.clipboard.writeText(data.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center flex-col gap-2">
        <div className="animate-pulse text-zinc-500">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] tracking-[0.25em] uppercase text-zinc-500 mb-2">FOMUS GUILD Members</p>
          <h1 className="text-2xl font-light text-white">紹介コード</h1>
          <p className="text-xs text-zinc-400 mt-2">
            あなたの紹介コードで枡が売れると、売上の10%がポイント還元されます。貯まったポイントは温泉チケットや桃と交換できます。
          </p>
        </div>

        {data ? (
          <div className="space-y-6">
            {/* Code Card */}
            <div className="bg-white/5 backdrop-blur rounded-2xl border border-teal-500/20 p-6 text-center">
              <p className="text-[10px] tracking-[0.2em] uppercase text-teal-400 mb-3">あなたの紹介コード</p>
              <p className="text-3xl font-light text-white tracking-[0.2em] mb-4">{data.code}</p>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm text-white transition-colors border border-zinc-700/50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {copied ? 'コピーしました' : 'コードをコピー'}
              </button>
              <p className="text-[10px] text-zinc-500 mt-4">
                FOMUS SHOPで枡を購入する際、このコードを入力してもらうと紹介が成立します
              </p>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur rounded-2xl border border-zinc-700/50 p-5 text-center">
                <p className="text-[10px] tracking-[0.15em] uppercase text-zinc-500 mb-2">累計還元ポイント</p>
                <p className="text-2xl font-light text-white">{data.totalPoints.toLocaleString()}pt</p>
              </div>
              <div className="bg-white/5 backdrop-blur rounded-2xl border border-zinc-700/50 p-5 text-center">
                <p className="text-[10px] tracking-[0.15em] uppercase text-zinc-500 mb-2">紹介経由の売上合計</p>
                <p className="text-2xl font-light text-white">¥{data.totalAmountJpy.toLocaleString()}</p>
              </div>
            </div>

            {/* History */}
            <div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-4">還元履歴</p>
              {data.history.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-zinc-500 text-sm">まだ紹介実績はありません</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.history.map((h) => (
                    <div
                      key={h.order_id}
                      className="flex justify-between items-center bg-white/5 backdrop-blur rounded-xl border border-zinc-700/50 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm text-white">¥{h.amount_jpy.toLocaleString()}の購入</p>
                        <p className="text-[10px] text-zinc-500">
                          {new Date(h.created_at).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                      <p className="text-sm text-teal-400">+{h.points.toLocaleString()}pt</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Link to shop */}
            <a
              href="https://shop.fomus.jp/shop"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-white/5 backdrop-blur rounded-2xl border border-zinc-700/50 overflow-hidden hover:border-zinc-500/50 transition-colors p-5 text-center"
            >
              <p className="text-sm font-medium text-white mb-1">FOMUS SHOPで枡を見る</p>
              <div className="mt-2 inline-flex items-center gap-2 text-[10px] tracking-[0.15em] uppercase text-zinc-400">
                <span>shop.fomus.jp</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </div>
            </a>
          </div>
        ) : (
          <p className="text-sm text-red-400 text-center">読み込みに失敗しました</p>
        )}
      </div>
    </div>
  )
}
