'use client'

import { QRCodeCanvas } from 'qrcode.react'
import { Profile, Rank } from '@/types/database'
import { formatDate } from '@/lib/utils'
import { calculateRank } from '@/config/rank'

interface MembershipCardProps {
  profile: Profile
  points: number
}

export function MembershipCard({ profile, points }: MembershipCardProps) {
  const rank = calculateRank(points)
  const qrValue = profile.membership_id || ''

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl p-6 text-white shadow-xl overflow-hidden">
        {/* 背景パターン */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24" />
        </div>

        {/* コンテンツ */}
        <div className="relative z-10">
          {/* ヘッダー */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold tracking-wide">FOMUS GUILD</h2>
              <p className="text-zinc-400 text-sm">Membership Card</p>
            </div>
            <RankBadge rank={rank} />
          </div>

          {/* メンバー情報 */}
          <div className="mb-6">
            <p className="text-2xl font-semibold mb-1">
              {profile.display_name || 'Member'}
            </p>
            <p className="text-zinc-400 font-mono text-sm">
              {profile.membership_id}
            </p>
          </div>

          {/* ポイントとQR */}
          <div className="flex justify-between items-end">
            <div>
              <p className="text-zinc-400 text-xs uppercase tracking-wider mb-1">
                MASU Point
              </p>
              <p className="text-3xl font-bold">{points.toLocaleString()}</p>
              <p className="text-zinc-500 text-xs mt-2">
                Since {formatDate(profile.created_at)}
              </p>
            </div>

            {/* QRコード */}
            <div className="bg-white p-2 rounded-lg">
              <QRCodeCanvas
                value={qrValue}
                size={80}
                level="M"
                bgColor="#ffffff"
                fgColor="#18181b"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RankBadge({ rank }: { rank: Rank }) {
  const colors = {
    D: 'bg-zinc-600',
    C: 'bg-amber-600',
    B: 'bg-zinc-400',
    A: 'bg-yellow-500',
  }

  return (
    <div
      className={`${colors[rank]} px-4 py-1.5 rounded-full text-sm font-bold shadow-lg`}
    >
      Rank {rank}
    </div>
  )
}
