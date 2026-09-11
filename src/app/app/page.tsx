import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { hasFullAccess } from '@/lib/access'
import { SUPER_ADMIN_EMAIL } from '@/config/admin'

/**
 * ログイン後の入口。
 * - 会員（有料・特別会員・管理者）→ マイページ（会員証・ポイント・招待・質問箱）
 * - 無料会員（free_tier＝記事リーダー）→ 記事一覧
 * ここに来る前に app/layout.tsx が認証・プロフィール完成をチェック済み。
 */
export default async function AppHome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, subscription_status')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin' || user.email === SUPER_ADMIN_EMAIL
    const isMember = isAdmin || hasFullAccess(profile?.subscription_status || 'free_tier')
    if (!isMember) redirect('/app/feed')
  }

  redirect('/app/profile')
}
