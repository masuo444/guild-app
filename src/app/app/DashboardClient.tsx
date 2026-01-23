'use client'

import { Profile, ActivityLog } from '@/types/database'
import { MembershipCard } from '@/components/membership/MembershipCard'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { calculateRank, getPointsToNextRank } from '@/config/rank'
import { formatDate } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n'

interface DashboardClientProps {
  profile: Profile
  totalPoints: number
  recentLogs: ActivityLog[]
  inviteCount: number
}

export function DashboardClient({ profile, totalPoints, recentLogs, inviteCount }: DashboardClientProps) {
  const rank = calculateRank(totalPoints)
  const pointsToNext = getPointsToNextRank(totalPoints)
  const { language, setLanguage, t } = useLanguage()

  const cardTranslations = {
    guildMember: t.guildMember,
    memberSince: t.memberSince,
    points: t.points,
    rank: t.rank,
    tapToFlip: 'Tap to flip',
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{t.dashboard}</h1>
        <button
          onClick={() => setLanguage(language === 'ja' ? 'en' : 'ja')}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white transition-colors"
        >
          {language === 'ja' ? 'EN' : 'JA'}
        </button>
      </div>

      {/* 会員証 */}
      <div className="mb-8">
        <MembershipCard profile={profile} points={totalPoints} inviteCount={inviteCount} translations={cardTranslations} />
      </div>

      {/* ステータスカード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label={t.rank}
          value={rank}
          sublabel={pointsToNext ? `${pointsToNext} ${t.ptsToNext}` : t.maxRank}
        />
        <StatCard
          label={t.masuPoints}
          value={totalPoints.toLocaleString()}
        />
        <StatCard
          label={t.memberSince}
          value={new Date(profile.created_at).getFullYear().toString()}
        />
        <StatCard
          label={t.location}
          value={profile.home_city || t.notSet}
          sublabel={profile.home_country || ''}
        />
      </div>

      {/* 最近のアクティビティ */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-white">{t.recentActivity}</h2>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-zinc-300 text-sm">{t.noActivity}</p>
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

