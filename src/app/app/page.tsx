import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './DashboardClient'
import { Profile } from '@/types/database'

// デモ用のHub データ
const demoHubs = [
  { id: '1', name: 'MASU Tokyo', city: 'Tokyo', country: 'Japan', description: 'The flagship MASU Hub in Tokyo' },
  { id: '2', name: 'MASU Osaka', city: 'Osaka', country: 'Japan', description: 'Western Japan hub for creators' },
  { id: '3', name: 'MASU Singapore', city: 'Singapore', country: 'Singapore', description: 'Southeast Asia gateway' },
]

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

  // デモモードの場合：Hubのみ表示、他はロック
  if (isDemo) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        {/* デモモードバナー */}
        <div className="bg-gradient-to-r from-[#c0c0c0]/20 to-[#c0c0c0]/10 border border-[#c0c0c0]/30 rounded-xl px-4 py-3 mb-6">
          <p className="font-medium text-white">FOMUS GUILD Preview</p>
          <p className="text-sm text-zinc-400">MASU Hubsをプレビューできます。全機能を利用するにはギルドメンバーになってください。</p>
        </div>

        <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

        {/* MASU Hubs セクション（公開） */}
        <div className="bg-white/10 backdrop-blur rounded-xl p-6 mb-6 border border-zinc-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">MASU Hubs</h2>
              <p className="text-sm text-zinc-400">Global network of partner locations</p>
            </div>
          </div>

          <div className="space-y-3">
            {demoHubs.map((hub) => (
              <div key={hub.id} className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-600/30">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-white">{hub.name}</h3>
                    <p className="text-sm text-zinc-400">{hub.city}, {hub.country}</p>
                    <p className="text-sm text-zinc-300 mt-1">{hub.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/app/map?demo=true"
            className="mt-4 inline-flex items-center gap-2 text-[#c0c0c0] hover:text-white transition-colors text-sm"
          >
            View Full Map
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

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

        {/* 参加を促すCTA */}
        <div className="bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-xl p-8 text-center border border-zinc-500/30">
          <h2 className="text-2xl font-bold text-white mb-4">Join FOMUS GUILD</h2>
          <p className="text-zinc-300 mb-6">
            Unlock all features, earn MASU Points, and connect with global creators.
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
