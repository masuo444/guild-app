import { Rank } from '@/types/database'

export const RANK_THRESHOLDS: Record<Rank, number> = {
  D: 0,
  C: 100,
  B: 300,
  A: 800,
}

export const RANK_ORDER: Rank[] = ['D', 'C', 'B', 'A']

export function calculateRank(points: number): Rank {
  if (points >= RANK_THRESHOLDS.A) return 'A'
  if (points >= RANK_THRESHOLDS.B) return 'B'
  if (points >= RANK_THRESHOLDS.C) return 'C'
  return 'D'
}

export function getNextRank(currentRank: Rank): Rank | null {
  const index = RANK_ORDER.indexOf(currentRank)
  if (index === RANK_ORDER.length - 1) return null
  return RANK_ORDER[index + 1]
}

export function getPointsToNextRank(currentPoints: number): number | null {
  const currentRank = calculateRank(currentPoints)
  const nextRank = getNextRank(currentRank)
  if (!nextRank) return null
  return RANK_THRESHOLDS[nextRank] - currentPoints
}
