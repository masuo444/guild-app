import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './DashboardClient'
import { Profile } from '@/types/database'

// ギルドメンバー限定セクションコンポーネント
function GuildMemberOnlySection({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-6 mb-6 relative overflow-hidden border border-zinc-500/30">
      <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
        <div className="text-center p-6">
          <svg className="w-12 h-12 mx-auto mb-3 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-lg font-medium text-white mb-2">Guild Member Only</p>
          <p className="text-sm text-zinc-400 mb-4">{description}</p>
          <Link
            href="/auth/login"
            className="inline-block px-6 py-2 bg-[#c0c0c0] text-zinc-900 rounded-lg font-medium hover:bg-white transition-colors"
          >
            Join Guild
          </Link>
        </div>
      </div>
      <h2 className="text-xl font-semibold text-zinc-600 mb-4">{title}</h2>
      <div className="h-32 bg-zinc-800/50 rounded-lg"></div>
    </div>
  )
}

interface Props {
  searchParams: Promise<{ demo?: string }>
}

export default async function DashboardPage(props: Props) {
  const searchParams = await props.searchParams
  const isDemo = searchParams?.demo === 'true'

  // デモモードの場合：マップのみアクセス可能、他は全て制限
  if (isDemo) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        {/* デモモードバナー */}
        <div className="bg-gradient-to-r from-[#c0c0c0]/20 to-[#c0c0c0]/10 border border-[#c0c0c0]/30 rounded-xl px-4 py-3 mb-6">
          <p className="font-medium text-white">FOMUS GUILD Preview</p>
          <p className="text-sm text-zinc-400">デモモードではマップ機能のみご利用いただけます。</p>
        </div>

        <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

        {/* マップへのアクセス（公開） */}
        <Link
          href="/app/map?demo=true"
          className="block bg-gradient-to-r from-orange-500/20 to-orange-500/10 backdrop-blur rounded-xl p-6 mb-6 border border-orange-500/30 hover:border-orange-500/50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-orange-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white mb-1">Guild Map</h2>
              <p className="text-sm text-zinc-300">MASU Hubsの場所を確認できます</p>
            </div>
            <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        {/* ギルドメンバー限定セクション */}
        <GuildMemberOnlySection
          title="Membership Card"
          description="View your digital membership card and rank"
        />

        <GuildMemberOnlySection
          title="MASU Points"
          description="Track your points and rank progress"
        />

        <GuildMemberOnlySection
          title="Offers & Quests"
          description="Access exclusive offers and complete quests for rewards"
        />

        <GuildMemberOnlySection
          title="Profile"
          description="Manage your profile and settings"
        />

        {/* 参加を促すCTA */}
        <div className="bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-xl p-8 text-center border border-zinc-500/30">
          <h2 className="text-2xl font-bold text-white mb-4">Join FOMUS GUILD</h2>
          <p className="text-zinc-300 mb-6">
            全機能にアクセスして、MASU Pointsを獲得しよう。
          </p>
          <Link
            href="/auth/login"
            className="inline-block px-8 py-3 bg-[#c0c0c0] text-zinc-900 font-medium rounded-lg hover:bg-white transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    )
  }

  // 本番モード：Supabaseから実データを取得
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 未ログインの場合はログインページへリダイレクト
  if (!user) {
    redirect('/auth/login')
  }

  // プロフィール取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // アクティビティログ取得
  const { data: logs } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // ポイント集計
  const totalPoints = logs?.reduce((sum, log) => sum + (log.points || 0), 0) ?? 0

  // プロフィールがない場合のフォールバック
  const userProfile: Profile = profile || {
    id: user.id,
    display_name: user.email?.split('@')[0] || 'User',
    role: 'user',
    membership_status: 'pending',
    membership_type: 'free',
    membership_id: null,
    subscription_status: 'free_tier',
    stripe_customer_id: null,
    stripe_subscription_id: null,
    home_country: null,
    home_city: null,
    lat: null,
    lng: null,
    instagram_id: null,
    avatar_url: null,
    show_location_on_map: false,
    created_at: new Date().toISOString(),
  }

  return (
    <DashboardClient
      profile={userProfile}
      totalPoints={totalPoints}
      recentLogs={logs || []}
    />
  )
}
