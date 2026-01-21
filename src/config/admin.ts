// 特別管理者（スーパー管理者パネルにアクセス可能）
export const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || ''

// 無料招待を発行できるかチェック（adminロールを持つ全員が可能）
export function canIssueFreeInvite(_adminEmail: string): boolean {
  // 全てのadminが無料招待コードを発行可能
  return true
}
