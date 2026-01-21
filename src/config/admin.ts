// 特別管理者（無料招待コードを発行可能）
export const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || ''

// 無料招待を発行できるかチェック
export function canIssueFreeInvite(adminEmail: string): boolean {
  if (!SUPER_ADMIN_EMAIL) return false
  return adminEmail === SUPER_ADMIN_EMAIL
}
