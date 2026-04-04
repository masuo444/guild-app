'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Profile, ActivityLog } from '@/types/database'
import { MembershipCard } from '@/components/membership/MembershipCard'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { calculateRank } from '@/config/rank'
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

      {/* GUILD SERVICES */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          {language === 'ja' ? 'ギルドサービス' : 'Guild Services'}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <a
            href="https://kuku-post.fomusglobal.com/ja"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-500/30 p-4 hover:border-rose-400/50 transition-all hover:scale-[1.02]"
          >
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm">KUKU-POST</p>
                <p className="text-zinc-400 text-xs mt-0.5">
                  {language === 'ja' ? '広告なしファイル転送' : 'Ad-free File Transfer'}
                </p>
              </div>
            </div>
            <svg className="absolute top-3 right-3 w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
          <a
            href="https://masuphoto.fomusglobal.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30 p-4 hover:border-violet-400/50 transition-all hover:scale-[1.02]"
          >
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm">MASU PHOTO</p>
                <p className="text-zinc-400 text-xs mt-0.5">
                  {language === 'ja' ? '枡フォト写真集' : 'Masu Photo Gallery'}
                </p>
              </div>
            </div>
            <svg className="absolute top-3 right-3 w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        </div>
      </div>

      {/* ガイドリンク */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/guide"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-zinc-500/30 transition-colors"
        >
          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
          <span className="text-sm text-white font-medium">
            {language === 'ja' ? 'ガイド' : 'Guide'}
          </span>
        </Link>
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