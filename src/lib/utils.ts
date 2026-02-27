import { v4 as uuidv4 } from 'uuid'

export function generateMembershipId(): string {
  const uuid = uuidv4().replace(/-/g, '').toUpperCase()
  return `FG-${uuid.substring(0, 8)}`
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * 招待コードの上限数を計算
 * 累計10人招待済み → 次は30人まで招待可能
 */
export function getInviteMaxUses(totalInvites: number): number {
  return totalInvites >= 10 ? 30 : 10
}
