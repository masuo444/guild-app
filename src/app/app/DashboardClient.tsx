'use client'

import { Profile, ActivityLog } from '@/types/database'
import { MembershipCard } from '@/components/membership/MembershipCard'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { calculateRank, getPointsToNextRank, RANK_THRESHOLDS } from '@/config/rank'
import { formatDate } from '@/lib/utils'

interface DashboardClientProps {
  profile: Profile
  totalPoints: number
  recentLogs: ActivityLog[]
}

export function DashboardClient({ profile, totalPoints, recentLogs }: DashboardClientProps) {
  const rank = calculateRank(totalPoints)
  const pointsToNext = getPointsToNextRank(totalPoints)

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      {/* 会員証 */}
      <div className="mb-8">
        <MembershipCard profile={profile} points={totalPoints} />
      </div>

      {/* ステータスカード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Rank"
          value={rank}
          sublabel={pointsToNext ? `${pointsToNext} pts to next` : 'Max Rank'}
        />
        <StatCard
          label="MASU Points"
          value={totalPoints.toLocaleString()}
        />
        <StatCard
          label="Member Since"
          value={new Date(profile.created_at).getFullYear().toString()}
        />
        <StatCard
          label="Location"
          value={profile.home_city || 'Not set'}
          sublabel={profile.home_country || ''}
        />
      </div>

      {/* ランク進捗 */}
      <Card className="mb-8">
        <CardHeader>
          <h2 className="font-semibold text-white">Rank Progress</h2>
        </CardHeader>
        <CardContent>
          <RankProgress currentPoints={totalPoints} />
        </CardContent>
      </Card>

      {/* 最近のアクティビティ */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-white">Recent Activity</h2>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-zinc-300 text-sm">No activity yet</p>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex justify-between items-center py-2 border-b border-zinc-500/30 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{log.type}</p>
                    {log.note && (
                      <p className="text-xs text-zinc-300">{log.note}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${log.points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {log.points >= 0 ? '+' : ''}{log.points}
                    </p>
                    <p className="text-xs text-zinc-300">{formatDate(log.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  label,
  value,
  sublabel,
}: {
  label: string
  value: string
  sublabel?: string
}) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-zinc-500/30">
      <p className="text-xs text-zinc-300 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
      {sublabel && <p className="text-xs text-zinc-300 mt-1">{sublabel}</p>}
    </div>
  )
}

function RankProgress({ currentPoints }: { currentPoints: number }) {
  const ranks = ['D', 'C', 'B', 'A'] as const
  const maxPoints = RANK_THRESHOLDS.A
  const progress = Math.min((currentPoints / maxPoints) * 100, 100)

  return (
    <div>
      <div className="flex justify-between mb-2">
        {ranks.map((rank) => (
          <div
            key={rank}
            className={`text-sm font-medium ${
              currentPoints >= RANK_THRESHOLDS[rank]
                ? 'text-white'
                : 'text-zinc-300/50'
            }`}
          >
            {rank}
          </div>
        ))}
      </div>
      <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#c0c0c0] via-[#c0c0c0] to-white rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-xs text-zinc-300">
        <span>0</span>
        <span>{RANK_THRESHOLDS.C}</span>
        <span>{RANK_THRESHOLDS.B}</span>
        <span>{RANK_THRESHOLDS.A}+</span>
      </div>
    </div>
  )
}
