import { SubscriptionStatus } from '@/types/database'

// 管理者メールアドレス
export const ADMIN_EMAILS = ['keisukendo414@gmail.com'] as const

// 有料サブスクリプションのステータス
const PAID_STATUSES: SubscriptionStatus[] = ['active']

// 特別会員（無料でアクセス可能）のステータス
const FREE_MEMBER_STATUSES: SubscriptionStatus[] = ['free']

// 有料機能にアクセスできるステータス（有料会員 + 特別会員）
const FULL_ACCESS_STATUSES: SubscriptionStatus[] = [...PAID_STATUSES, ...FREE_MEMBER_STATUSES]

// 無料登録ユーザーかどうか
export function isFreeTierUser(status: SubscriptionStatus): boolean {
  return status === 'free_tier'
}

// 特別会員（無料招待）かどうか
export function isFreeMember(status: SubscriptionStatus): boolean {
  return FREE_MEMBER_STATUSES.includes(status)
}

// 有料サブスクリプション会員かどうか
export function isPaidMember(status: SubscriptionStatus): boolean {
  return PAID_STATUSES.includes(status)
}

// メンバーMAP（位置・メンバーピン）を閲覧できるか
// → 有料会員(active)・特別会員(free)のみ。無料登録(free_tier)は不可。
export function canViewMembers(status: SubscriptionStatus): boolean {
  return FULL_ACCESS_STATUSES.includes(status)
}

// 限定コンテンツ（有料記事・まっすーフィードの有料回など）を閲覧できるか
// → 有料会員・特別会員のみ。将来の記事機能で使う。
export function canViewPremiumContent(status: SubscriptionStatus): boolean {
  return FULL_ACCESS_STATUSES.includes(status)
}

// オファー/クエストを閲覧できるか（無料登録ユーザー含め全員可能：エンゲージメント目的）
export function canViewOffers(status: SubscriptionStatus): boolean {
  return true
}

// 拠点を登録できるか（登録済みユーザーは全員登録可能）
export function canRegisterHub(status: SubscriptionStatus): boolean {
  return true
}

// ダッシュボードの詳細を閲覧できるか（登録済みユーザーは全員閲覧可能）
export function canViewDashboardDetails(status: SubscriptionStatus): boolean {
  return true
}

// フル機能（有料相当）にアクセスできるか
export function hasFullAccess(status: SubscriptionStatus): boolean {
  return FULL_ACCESS_STATUSES.includes(status)
}

// 管理者メールアドレスかどうか
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email as typeof ADMIN_EMAILS[number])
}

// 管理者ロールかどうか
export function isAdmin(role: string | null | undefined): boolean {
  return role === 'admin'
}
