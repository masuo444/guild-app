'use client'

import { useState } from 'react'
import { Profile, Rank, MembershipType, isFreeMembershipType, MEMBERSHIP_TYPE_LABELS } from '@/types/database'
import { formatDate } from '@/lib/utils'
import { calculateRank } from '@/config/rank'

interface MembershipCardProps {
  profile: Profile
  points: number
  inviteCount?: number
  translations?: {
    guildMember: string
    memberSince: string
    points: string
    rank: string
    invites?: string
    tapToFlip?: string
  }
}

// メンバータイプバッジのスタイル設定
const MEMBERSHIP_TYPE_STYLES: Record<MembershipType, { bgColor: string; textColor: string }> = {
  standard: { bgColor: '#4a4540', textColor: '#a89984' },
  model: { bgColor: '#be185d', textColor: '#fce7f3' },      // Pink
  ambassador: { bgColor: '#7e22ce', textColor: '#f3e8ff' }, // Purple
  staff: { bgColor: '#1d4ed8', textColor: '#dbeafe' },      // Blue
  partner: { bgColor: '#b45309', textColor: '#fef3c7' },    // Amber
}

// 装飾コーナーフレームSVG
function CornerFrame({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const rotations = {
    tl: '',
    tr: 'scale(-1, 1)',
    bl: 'scale(1, -1)',
    br: 'scale(-1, -1)',
  }

  const positions = {
    tl: 'top-2 left-2',
    tr: 'top-2 right-2',
    bl: 'bottom-2 left-2',
    br: 'bottom-2 right-2',
  }

  return (
    <div className={`absolute ${positions[position]} w-8 h-8 pointer-events-none`}>
      <svg
        viewBox="0 0 32 32"
        className="w-full h-full"
        style={{ transform: rotations[position] }}
      >
        <path
          d="M2 12 L2 2 L12 2"
          fill="none"
          stroke="#d4af37"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M2 8 L2 2 L8 2"
          fill="none"
          stroke="#f4d03f"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.5"
        />
        <circle cx="2" cy="2" r="1.5" fill="#d4af37" />
      </svg>
    </div>
  )
}

// ギルドエンブレム（盾型シンボル）
function GuildEmblem() {
  return (
    <div className="relative w-10 h-10">
      <svg viewBox="0 0 40 40" className="w-full h-full">
        {/* 盾の外形 */}
        <path
          d="M20 2 L36 8 L36 20 C36 30 20 38 20 38 C20 38 4 30 4 20 L4 8 L20 2 Z"
          fill="url(#shieldGradient)"
          stroke="#d4af37"
          strokeWidth="1.5"
        />
        {/* 内側の装飾 */}
        <path
          d="M20 6 L32 10 L32 19 C32 27 20 33 20 33 C20 33 8 27 8 19 L8 10 L20 6 Z"
          fill="none"
          stroke="#d4af37"
          strokeWidth="0.5"
          opacity="0.5"
        />
        {/* FGの文字 */}
        <text
          x="20"
          y="23"
          textAnchor="middle"
          fill="#d4af37"
          fontSize="10"
          fontWeight="bold"
          fontFamily="serif"
        >
          FG
        </text>
        <defs>
          <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2a2420" />
            <stop offset="50%" stopColor="#3a332e" />
            <stop offset="100%" stopColor="#1a1614" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

export function MembershipCard({ profile, points, inviteCount = 0, translations }: MembershipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const rank = calculateRank(points)
  const membershipType = profile.membership_type || 'standard'
  const isFree = isFreeMembershipType(membershipType)
  const typeStyle = MEMBERSHIP_TYPE_STYLES[membershipType]

  const t = translations || {
    guildMember: 'Guild Member',
    memberSince: 'Member Since',
    points: 'Points',
    rank: 'Rank',
    invites: 'Invites',
    tapToFlip: 'Tap to flip',
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  return (
    <div className="w-full max-w-md mx-auto" style={{ perspective: '1000px' }}>
      <div
        onClick={handleFlip}
        className="relative aspect-[1.586/1] cursor-pointer"
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* 表面（フロント） */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {/* メイン背景（ダーク革風） */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #2a2420 0%, #1a1614 50%, #2a2420 100%)',
            }}
          />

          {/* 微細なテクスチャ効果 */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* ゴールドのグロー効果 */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#d4af37] via-transparent to-transparent" />
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#b8860b] via-transparent to-transparent" />

          {/* シマー効果（アニメーション） */}
          <div className="absolute inset-0 opacity-5 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent -translate-x-full animate-[shimmer_4s_infinite]" />

          {/* コーナーフレーム */}
          <CornerFrame position="tl" />
          <CornerFrame position="tr" />
          <CornerFrame position="bl" />
          <CornerFrame position="br" />

          {/* 内側のゴールドボーダー */}
          <div className="absolute inset-3 rounded-lg border border-[#d4af37]/30" />

          {/* メインコンテンツ */}
          <div className="relative z-10 h-full p-5 flex flex-col justify-between">
            {/* トップセクション */}
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <GuildEmblem />
                  <div>
                    <h2 className="text-[#f5e6d3] font-bold text-lg tracking-wider" style={{ fontFamily: 'serif' }}>
                      FOMUS GUILD
                    </h2>
                    <p className="text-[#a89984] text-[10px] uppercase tracking-[0.2em]">
                      {t.guildMember}
                    </p>
                  </div>
                </div>
              </div>
              <ShieldRankBadge rank={rank} label={t.rank} />
            </div>

            {/* センターセクション - メンバー名 */}
            <div className="flex-1 flex items-center">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[#f5e6d3] text-2xl font-light tracking-wide" style={{ fontFamily: 'serif' }}>
                    {profile.display_name || 'Member'}
                  </p>
                  {/* 無料メンバーバッジ */}
                  {isFree && (
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: typeStyle.bgColor,
                        color: typeStyle.textColor,
                      }}
                    >
                      {MEMBERSHIP_TYPE_LABELS[membershipType]}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-12 h-px bg-gradient-to-r from-[#d4af37]/60 to-transparent" />
                  <p className="text-[#6b5b4f] font-mono text-xs tracking-wider">
                    {profile.membership_id}
                  </p>
                </div>
              </div>
            </div>

            {/* ボトムセクション */}
            <div className="flex justify-between items-end">
              {/* ポイント */}
              <div>
                <p className="text-[#6b5b4f] text-[10px] uppercase tracking-[0.15em] mb-0.5">
                  {t.points}
                </p>
                <p className="text-[#d4af37] text-3xl font-light" style={{ fontFamily: 'serif' }}>
                  {points.toLocaleString()}
                  <span className="text-[#6b5b4f] text-sm ml-1">pt</span>
                </p>
              </div>

              {/* 加入日 */}
              <div className="text-right">
                <p className="text-[#6b5b4f] text-[10px] uppercase tracking-[0.15em] mb-0.5">
                  {t.memberSince}
                </p>
                <p className="text-[#a89984] text-sm font-light">
                  {formatDate(profile.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* カードエッジのハイライト */}
          <div className="absolute inset-0 rounded-xl border border-[#d4af37]/20" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4af37]/20 to-transparent" />
        </div>

        {/* 裏面（バック） */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* 背景 */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #1a1614 0%, #2a2420 50%, #1a1614 100%)',
            }}
          />

          {/* テクスチャ */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* ゴールドのグロー効果 */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#d4af37] via-transparent to-transparent" />

          {/* コーナーフレーム */}
          <CornerFrame position="tl" />
          <CornerFrame position="tr" />
          <CornerFrame position="bl" />
          <CornerFrame position="br" />

          {/* 内側のゴールドボーダー */}
          <div className="absolute inset-3 rounded-lg border border-[#d4af37]/30" />

          {/* 裏面コンテンツ - 招待数のみ */}
          <div className="relative z-10 h-full flex items-center justify-center">
            <p className="text-[#d4af37] text-7xl font-light" style={{ fontFamily: 'serif' }}>
              {inviteCount}
            </p>
          </div>

          {/* カードエッジのハイライト */}
          <div className="absolute inset-0 rounded-xl border border-[#d4af37]/20" />
        </div>
      </div>

      {/* タップヒント */}
      <p className="text-center text-[#6b5b4f] text-xs mt-2">{t.tapToFlip}</p>

      {/* スタイル定義 */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </div>
  )
}

// シールド型ランクバッジ
function ShieldRankBadge({ rank, label }: { rank: Rank; label: string }) {
  const styles = {
    D: {
      bgGradient: 'from-[#4a4540] to-[#3a3530]',
      borderColor: '#6b5b4f',
      textColor: '#a89984',
      glowColor: 'rgba(107, 91, 79, 0.3)',
    },
    C: {
      bgGradient: 'from-[#b8860b] to-[#8b6914]',
      borderColor: '#d4af37',
      textColor: '#f5e6d3',
      glowColor: 'rgba(212, 175, 55, 0.4)',
    },
    B: {
      bgGradient: 'from-[#c0c0c0] to-[#808080]',
      borderColor: '#e0e0e0',
      textColor: '#1a1614',
      glowColor: 'rgba(192, 192, 192, 0.4)',
    },
    A: {
      bgGradient: 'from-[#f4d03f] to-[#d4af37]',
      borderColor: '#f4d03f',
      textColor: '#1a1614',
      glowColor: 'rgba(244, 208, 63, 0.5)',
    },
  }

  const style = styles[rank]

  return (
    <div className="relative">
      {/* グロー効果 */}
      <div
        className="absolute inset-0 blur-md rounded-lg"
        style={{ backgroundColor: style.glowColor }}
      />

      {/* シールド型バッジ */}
      <div className="relative">
        <svg viewBox="0 0 50 60" className="w-12 h-14">
          <defs>
            <linearGradient id={`rankGradient-${rank}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={rank === 'D' ? '#4a4540' : rank === 'C' ? '#b8860b' : rank === 'B' ? '#c0c0c0' : '#f4d03f'} />
              <stop offset="100%" stopColor={rank === 'D' ? '#3a3530' : rank === 'C' ? '#8b6914' : rank === 'B' ? '#808080' : '#d4af37'} />
            </linearGradient>
          </defs>

          {/* シールド本体 */}
          <path
            d="M25 2 L46 10 L46 28 C46 42 25 56 25 56 C25 56 4 42 4 28 L4 10 L25 2 Z"
            fill={`url(#rankGradient-${rank})`}
            stroke={style.borderColor}
            strokeWidth="2"
          />

          {/* 内側の装飾線 */}
          <path
            d="M25 8 L40 14 L40 27 C40 38 25 49 25 49 C25 49 10 38 10 27 L10 14 L25 8 Z"
            fill="none"
            stroke={style.borderColor}
            strokeWidth="0.5"
            opacity="0.5"
          />

          {/* ラベル */}
          <text
            x="25"
            y="22"
            textAnchor="middle"
            fill={style.textColor}
            fontSize="7"
            opacity="0.8"
            style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
          >
            {label}
          </text>

          {/* ランク文字 */}
          <text
            x="25"
            y="40"
            textAnchor="middle"
            fill={style.textColor}
            fontSize="18"
            fontWeight="bold"
            fontFamily="serif"
          >
            {rank}
          </text>
        </svg>
      </div>
    </div>
  )
}
