'use client'

import { useState } from 'react'
import { Profile, Rank, MembershipType, isFreeMembershipType, MEMBERSHIP_TYPE_LABELS } from '@/types/database'
import { formatDate } from '@/lib/utils'
import { calculateRank } from '@/config/rank'

interface MembershipCardProps {
  profile: Profile
  points: number
  inviteCount?: number
  masuPoints?: number
  translations?: {
    guildMember: string
    memberSince: string
    points: string
    rank: string
    invites?: string
    tapToFlip?: string
    serialNumber?: string
  }
}

// メンバータイプバッジのスタイル設定
const MEMBERSHIP_TYPE_STYLES: Record<MembershipType, { bgColor: string; textColor: string }> = {
  standard: { bgColor: '#4a4540', textColor: '#a89984' },
  ambassador: { bgColor: '#7e22ce', textColor: '#f3e8ff' }, // Purple
  partner: { bgColor: '#b45309', textColor: '#fef3c7' },    // Amber
}

// ランク別カラーテーマ定義
const RANK_THEMES: Record<Rank, {
  primary: string
  secondary: string
  bgFrom: string
  bgTo: string
  glow: string
  shimmer: string
}> = {
  E: { primary: '#4a6fa5', secondary: '#3d5a80', bgFrom: '#1a2a4a', bgTo: '#0d1a2d', glow: 'rgba(74,111,165,0.4)', shimmer: 'rgba(74,111,165,0.5)' },
  D: { primary: '#6b5b4f', secondary: '#5a4a3f', bgFrom: '#3a3530', bgTo: '#2a2420', glow: 'rgba(107,91,79,0.2)', shimmer: 'rgba(107,91,79,0.3)' },
  C: { primary: '#cd7f32', secondary: '#b87333', bgFrom: '#4a3828', bgTo: '#2a2018', glow: 'rgba(205,127,50,0.3)', shimmer: 'rgba(205,127,50,0.4)' },
  B: { primary: '#c0c0c0', secondary: '#a8a8a8', bgFrom: '#4a4a4a', bgTo: '#2a2a2a', glow: 'rgba(192,192,192,0.4)', shimmer: 'rgba(192,192,192,0.5)' },
  A: { primary: '#d4af37', secondary: '#c9a227', bgFrom: '#4a3a28', bgTo: '#2a2418', glow: 'rgba(212,175,55,0.4)', shimmer: 'rgba(212,175,55,0.5)' },
  S: { primary: '#9b59b6', secondary: '#8e44ad', bgFrom: '#3a2a4a', bgTo: '#2a1a3a', glow: 'rgba(155,89,182,0.5)', shimmer: 'rgba(155,89,182,0.6)' },
  SS: { primary: '#a8e6ff', secondary: '#7dd3fc', bgFrom: '#0c1929', bgTo: '#030a12', glow: 'rgba(168,230,255,0.7)', shimmer: 'rgba(168,230,255,0.8)' },
}

// 装飾コーナーフレームSVG
function CornerFrame({ position, primary, secondary }: { position: 'tl' | 'tr' | 'bl' | 'br'; primary: string; secondary: string }) {
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
          stroke={primary}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M2 8 L2 2 L8 2"
          fill="none"
          stroke={secondary}
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.5"
        />
        <circle cx="2" cy="2" r="1.5" fill={primary} />
      </svg>
    </div>
  )
}

// 桜テーマのカラーオーバーライド
const SAKURA_THEME = {
  primary: '#e8a0b4',
  secondary: '#c97d94',
  bgFrom: '#3a1a28',
  bgTo: '#1a0d14',
  glow: 'rgba(232,160,180,0.4)',
  shimmer: 'rgba(255,183,197,0.5)',
}

// 桜の花びらSVGオーバーレイ
function SakuraPetals() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg className="absolute w-full h-full" viewBox="0 0 400 252" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="petalGrad" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#ffb7c5" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#e8a0b4" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* 花びら群 - 右上 */}
        <g transform="translate(320, 30) rotate(15)" opacity="0.25">
          <ellipse cx="0" cy="0" rx="18" ry="8" fill="#ffb7c5" transform="rotate(0)" />
          <ellipse cx="0" cy="0" rx="18" ry="8" fill="#ffb7c5" transform="rotate(72)" />
          <ellipse cx="0" cy="0" rx="18" ry="8" fill="#ffb7c5" transform="rotate(144)" />
          <ellipse cx="0" cy="0" rx="18" ry="8" fill="#ffb7c5" transform="rotate(216)" />
          <ellipse cx="0" cy="0" rx="18" ry="8" fill="#ffb7c5" transform="rotate(288)" />
          <circle cx="0" cy="0" r="5" fill="#d4829a" opacity="0.6" />
        </g>
        {/* 花びら群 - 左下 */}
        <g transform="translate(60, 200) rotate(-10)" opacity="0.2">
          <ellipse cx="0" cy="0" rx="14" ry="6" fill="#ffb7c5" transform="rotate(0)" />
          <ellipse cx="0" cy="0" rx="14" ry="6" fill="#ffb7c5" transform="rotate(72)" />
          <ellipse cx="0" cy="0" rx="14" ry="6" fill="#ffb7c5" transform="rotate(144)" />
          <ellipse cx="0" cy="0" rx="14" ry="6" fill="#ffb7c5" transform="rotate(216)" />
          <ellipse cx="0" cy="0" rx="14" ry="6" fill="#ffb7c5" transform="rotate(288)" />
          <circle cx="0" cy="0" r="4" fill="#d4829a" opacity="0.5" />
        </g>
        {/* 散り花びら */}
        <ellipse cx="150" cy="60" rx="6" ry="3" fill="#ffb7c5" opacity="0.3" transform="rotate(30 150 60)" />
        <ellipse cx="280" cy="140" rx="5" ry="2.5" fill="#ffb7c5" opacity="0.25" transform="rotate(-20 280 140)" />
        <ellipse cx="80" cy="100" rx="4" ry="2" fill="#ffb7c5" opacity="0.2" transform="rotate(60 80 100)" />
        <ellipse cx="350" cy="190" rx="5" ry="2" fill="#ffb7c5" opacity="0.2" transform="rotate(45 350 190)" />
        <ellipse cx="200" cy="220" rx="4" ry="2" fill="#ffb7c5" opacity="0.15" transform="rotate(-35 200 220)" />
        <ellipse cx="40" cy="40" rx="3" ry="1.5" fill="#ffb7c5" opacity="0.2" transform="rotate(10 40 40)" />
        <ellipse cx="250" cy="30" rx="4" ry="2" fill="#ffb7c5" opacity="0.15" transform="rotate(-50 250 30)" />
        {/* 枝のライン */}
        <path d="M360 0 Q340 40 310 50 Q290 55 270 45" fill="none" stroke="#8b5e6b" strokeWidth="1" opacity="0.15" />
        <path d="M0 230 Q30 210 55 205 Q75 200 90 210" fill="none" stroke="#8b5e6b" strokeWidth="0.8" opacity="0.12" />
      </svg>
    </div>
  )
}

// ギルドエンブレム（盾型シンボル）
function GuildEmblem({ primary, bgFrom, bgTo }: { primary: string; bgFrom: string; bgTo: string }) {
  return (
    <div className="relative w-10 h-10">
      <svg viewBox="0 0 40 40" className="w-full h-full">
        {/* 盾の外形 */}
        <path
          d="M20 2 L36 8 L36 20 C36 30 20 38 20 38 C20 38 4 30 4 20 L4 8 L20 2 Z"
          fill="url(#shieldGradient)"
          stroke={primary}
          strokeWidth="1.5"
        />
        {/* 内側の装飾 */}
        <path
          d="M20 6 L32 10 L32 19 C32 27 20 33 20 33 C20 33 8 27 8 19 L8 10 L20 6 Z"
          fill="none"
          stroke={primary}
          strokeWidth="0.5"
          opacity="0.5"
        />
        {/* FGの文字 */}
        <text
          x="20"
          y="23"
          textAnchor="middle"
          fill={primary}
          fontSize="10"
          fontWeight="bold"
          fontFamily="serif"
        >
          FG
        </text>
        <defs>
          <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={bgFrom} />
            <stop offset="50%" stopColor={bgTo} />
            <stop offset="100%" stopColor={bgFrom} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

export function MembershipCard({ profile, points, inviteCount = 0, masuPoints = 0, translations }: MembershipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const rank = calculateRank(points)
  const membershipType = profile.membership_type || 'standard'
  const isFree = isFreeMembershipType(membershipType)
  const typeStyle = MEMBERSHIP_TYPE_STYLES[membershipType]
  const isSakura = profile.card_theme === 'sakura'
  const theme = isSakura ? SAKURA_THEME : RANK_THEMES[rank]

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
    <div className="w-full max-w-md mx-auto" style={{ perspective: '1000px', WebkitPerspective: '1000px' }}>
      <div
        onClick={handleFlip}
        className="relative aspect-[1.586/1] cursor-pointer"
        style={{
          transformStyle: 'preserve-3d',
          WebkitTransformStyle: 'preserve-3d',
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
            transform: 'rotateY(0deg)',
          }}
        >
          {/* メイン背景（ランク別） */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${theme.bgFrom} 0%, ${theme.bgTo} 50%, ${theme.bgFrom} 100%)`,
            }}
          />

          {/* 微細なテクスチャ効果 */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* グロー効果（ランク別） */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(ellipse at top right, ${theme.primary}, transparent, transparent)`,
            }}
          />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              background: `radial-gradient(ellipse at bottom left, ${theme.secondary}, transparent, transparent)`,
            }}
          />

          {/* シマー効果（アニメーション・ランク別） */}
          <div
            className="absolute inset-0 opacity-5 -translate-x-full animate-[shimmer_4s_infinite]"
            style={{
              background: `linear-gradient(to right, transparent, ${theme.shimmer}, transparent)`,
            }}
          />

          {/* 桜テーマオーバーレイ */}
          {isSakura && <SakuraPetals />}

          {/* コーナーフレーム（ランク別） */}
          <CornerFrame position="tl" primary={theme.primary} secondary={theme.secondary} />
          <CornerFrame position="tr" primary={theme.primary} secondary={theme.secondary} />
          <CornerFrame position="bl" primary={theme.primary} secondary={theme.secondary} />
          <CornerFrame position="br" primary={theme.primary} secondary={theme.secondary} />

          {/* 内側のボーダー（ランク別） */}
          <div
            className="absolute inset-3 rounded-lg"
            style={{ border: `1px solid ${theme.primary}30` }}
          />

          {/* メインコンテンツ */}
          <div className="relative z-10 h-full p-5 flex flex-col justify-between">
            {/* トップセクション */}
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <GuildEmblem primary={theme.primary} bgFrom={theme.bgFrom} bgTo={theme.bgTo} />
                  <div>
                    <h2 className="text-[#f5e6d3] font-bold text-lg tracking-wider" style={{ fontFamily: 'serif' }}>
                      FOMUS GUILD
                    </h2>
                    <div className="flex items-center gap-2">
                      <p className="text-[#a89984] text-[10px] uppercase tracking-[0.2em]">
                        {t.guildMember}
                      </p>
                      {profile.serial_number != null && (
                        <p className="text-[#a89984] text-[10px] font-mono tracking-wider">
                          No.{String(profile.serial_number).padStart(4, '0')}
                        </p>
                      )}
                    </div>
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
                  <div
                    className="w-12 h-px"
                    style={{ background: `linear-gradient(to right, ${theme.primary}99, transparent)` }}
                  />
                  <p className="text-[#6b5b4f] font-mono text-xs tracking-wider">
                    {profile.membership_id}
                  </p>
                </div>
              </div>
            </div>

            {/* ボトムセクション */}
            <div className="flex justify-between items-end">
              {/* ポイント（ランク別カラー） */}
              <div>
                <p className="text-[#6b5b4f] text-[10px] uppercase tracking-[0.15em] mb-0.5">
                  {t.points}
                </p>
                <p className="text-3xl font-light" style={{ fontFamily: 'serif', color: theme.primary }}>
                  {points.toLocaleString()}
                  <span className="text-[#6b5b4f] text-sm ml-1">EXP</span>
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

          {/* カードエッジのハイライト（ランク別） */}
          <div
            className="absolute inset-0 rounded-xl"
            style={{ border: `1px solid ${theme.primary}33` }}
          />
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(to right, transparent, ${theme.primary}66, transparent)` }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(to right, transparent, ${theme.primary}33, transparent)` }}
          />
        </div>

        {/* 裏面（バック）- ランク別 */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* 背景（ランク別） */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${theme.bgTo} 0%, ${theme.bgFrom} 50%, ${theme.bgTo} 100%)`,
            }}
          />

          {/* グロー効果（ランク別） */}
          <div
            className="absolute inset-0"
            style={{
              boxShadow: `inset 0 0 60px ${theme.glow}`,
            }}
          />

          {/* 桜テーマオーバーレイ（裏面） */}
          {isSakura && <SakuraPetals />}

          {/* 裏面コンテンツ */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center gap-4">
            {/* 招待人数 */}
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.15em] mb-1" style={{ color: `${theme.primary}99` }}>
                {t.invites || 'Invites'}
              </p>
              <p className="text-5xl font-light" style={{ fontFamily: 'serif', color: theme.primary }}>
                {inviteCount}
              </p>
            </div>
            {/* MASU Points */}
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.15em] mb-1" style={{ color: `${theme.primary}99` }}>
                MASU Points
              </p>
              <p className="text-3xl font-light" style={{ fontFamily: 'serif', color: theme.primary }}>
                {masuPoints.toLocaleString()}
                <span className="text-sm ml-1" style={{ color: `${theme.primary}80` }}>pt</span>
              </p>
            </div>
          </div>
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
    E: {
      bgGradient: 'from-[#5a5a5a] to-[#3a3a3a]',
      borderColor: '#6a6a6a',
      textColor: '#b0b0b0',
      glowColor: 'rgba(100, 100, 100, 0.3)',
    },
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
    S: {
      bgGradient: 'from-[#9b59b6] to-[#6c3483]',
      borderColor: '#a569bd',
      textColor: '#f5e6ff',
      glowColor: 'rgba(155, 89, 182, 0.5)',
    },
    SS: {
      bgGradient: 'from-[#a8e6ff] to-[#38bdf8]',
      borderColor: '#7dd3fc',
      textColor: '#0c1929',
      glowColor: 'rgba(168, 230, 255, 0.7)',
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
              <stop offset="0%" stopColor={rank === 'E' ? '#5a5a5a' : rank === 'D' ? '#4a4540' : rank === 'C' ? '#b8860b' : rank === 'B' ? '#c0c0c0' : rank === 'A' ? '#f4d03f' : rank === 'S' ? '#9b59b6' : '#a8e6ff'} />
              <stop offset="100%" stopColor={rank === 'E' ? '#3a3a3a' : rank === 'D' ? '#3a3530' : rank === 'C' ? '#8b6914' : rank === 'B' ? '#808080' : rank === 'A' ? '#d4af37' : rank === 'S' ? '#6c3483' : '#38bdf8'} />
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
