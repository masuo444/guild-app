'use client'

import { Profile } from '@/types/database'
import { MembershipCard } from '@/components/membership/MembershipCard'
import { useLanguage } from '@/lib/i18n'

/** マイページ上部の会員証（ポイント・ランク・招待数つき） */
export function ProfileHero({ profile, statusPoints, masuPoints, inviteCount }: {
  profile: Profile; statusPoints: number; masuPoints: number; inviteCount: number
}) {
  const { t } = useLanguage()
  return (
    <div className="mb-6">
      <MembershipCard
        profile={profile}
        points={statusPoints}
        inviteCount={inviteCount}
        masuPoints={masuPoints}
        translations={{ guildMember: t.guildMember, memberSince: t.memberSince, points: t.points, rank: t.rank, tapToFlip: t.tapToFlip }}
      />
    </div>
  )
}
