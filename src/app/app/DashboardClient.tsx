'use client'

import { useState, useEffect } from 'react'
import { Profile, ActivityLog } from '@/types/database'
import { MembershipCard } from '@/components/membership/MembershipCard'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { calculateRank, getPointsToNextRank } from '@/config/rank'
import { formatDate } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n'
import type { LoginBonusResult } from './page'

interface DashboardClientProps {
  profile: Profile
  statusPoints: number
  masuPoints: number
  recentLogs: ActivityLog[]
  inviteCount: number
  loginBonusResult?: LoginBonusResult
}

export function DashboardClient({ profile, statusPoints, masuPoints, recentLogs, inviteCount, loginBonusResult }: DashboardClientProps) {
  const rank = calculateRank(statusPoints)
  const pointsToNext = getPointsToNextRank(statusPoints)
  const { language, setLanguage, t } = useLanguage()
  const [showBonusBanner, setShowBonusBanner] = useState(false)

  useEffect(() => {
    if (loginBonusResult?.dailyBonus) {
      setShowBonusBanner(true)
      const timer = setTimeout(() => setShowBonusBanner(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [loginBonusResult])

  const cardTranslations = {
    guildMember: t.guildMember,
    memberSince: t.memberSince,
    points: t.points,
    rank: t.rank,
    tapToFlip: t.tapToFlip,
  }

  const getBonusMessage = () => {
    if (!loginBonusResult?.dailyBonus) return null
    const parts: string[] = []
    parts.push(language === 'ja' ? '+10 ログインボーナス!' : '+10 Login Bonus!')
    if (loginBonusResult.streakBonus === 7) {
      parts.push(language === 'ja' ? '+50 7日連続ボーナス!' : '+50 7-Day Streak Bonus!')
    }
    if (loginBonusResult.streakBonus === 30) {
      parts.push(language === 'ja' ? '+150 30日連続ボーナス!' : '+150 30-Day Streak Bonus!')
    }
    if (loginBonusResult.streakDays > 1) {
      parts.push(
        language === 'ja'
          ? `${loginBonusResult.streakDays}日連続ログイン中`
          : `${loginBonusResult.streakDays}-day login streak`
      )
    }
    return parts
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

      {/* ログインボーナス通知 */}
      {showBonusBanner && (
        <div
          className="mb-6 p-4 rounded-xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 animate-in fade-in slide-in-from-top-2 duration-500"
          onClick={() => setShowBonusBanner(false)}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">&#x1F381;</span>
            <div>
              {getBonusMessage()?.map((msg, i) => (
                <p key={i} className={`text-sm font-semibold ${i === 0 ? 'text-yellow-300' : 'text-amber-300'}`}>
                  {msg}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 会員証 */}
      <div className="mb-8">
        <MembershipCard profile={profile} points={statusPoints} inviteCount={inviteCount} masuPoints={masuPoints} translations={cardTranslations} />
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
          value={masuPoints.toLocaleString()}
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
