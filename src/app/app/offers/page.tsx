import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UpgradeBanner } from '@/components/ui/UpgradeBanner'
import { SubscriptionStatus } from '@/types/database'
import { canViewOffers } from '@/lib/access'
import { OffersContent } from './OffersContent'

// ギルドメンバー限定表示コンポーネント
function GuildMemberOnlyPage({ title }: { title: string }) {
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">{title}</h1>

      <div className="bg-white/10 backdrop-blur rounded-xl p-8 border border-zinc-500/30 text-center">
        <svg className="w-16 h-16 mx-auto mb-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h2 className="text-xl font-semibold text-white mb-2">Guild Member Only</h2>
        <p className="text-zinc-400 mb-6">
          この機能はギルドメンバー限定です。<br />
          ギルドに参加して全機能をご利用ください。
        </p>
        <Link
          href="/auth/login"
          className="inline-block px-8 py-3 bg-[#c0c0c0] text-zinc-900 font-medium rounded-lg hover:bg-white transition-colors"
        >
          Join Guild
        </Link>
      </div>
    </div>
  )
}

interface Props {
  searchParams: Promise<{ demo?: string }>
}

export default async function OffersPage(props: Props) {
  const searchParams = await props.searchParams
  const isDemo = searchParams?.demo === 'true'

  // デモモードの場合はギルドメンバー限定表示
  if (isDemo) {
    return <GuildMemberOnlyPage title="特典" />
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // ユーザーのプロフィールを取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single()

  const subscriptionStatus = (profile?.subscription_status || 'free_tier') as SubscriptionStatus
  const canSeeOffers = canViewOffers(subscriptionStatus)

  // 無料ユーザーはアップグレード画面を表示
  if (!canSeeOffers) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">特典</h1>
        <p className="text-zinc-300 mb-6">
          メンバー限定の特典とクエスト
        </p>
        <UpgradeBanner
          title="特典へのアクセスにはアップグレードが必要です"
          description="サービス特典とクエストは有料メンバー限定です。メンバーシップをアップグレードして、割引や特別チャレンジなどの特典をご利用ください。"
          buttonText="アップグレード"
          fullScreen
        />
      </div>
    )
  }

  // 全てのクエリを並列実行
  const [
    { data: quests },
    { data: submissions },
  ] = await Promise.all([
    supabase
      .from('guild_quests')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('quest_submissions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">特典</h1>
      <p className="text-zinc-300 mb-6">
        メンバー限定の特典とクエスト
      </p>

      <OffersContent
        quests={quests || []}
        submissions={submissions || []}
        userId={user.id}
      />
    </div>
  )
}
