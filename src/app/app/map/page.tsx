import { createClient } from '@/lib/supabase/server'
import { GuildMap } from '@/components/map/GuildMap'

export default async function MapPage() {
  const supabase = await createClient()

  // アクティブなメンバーを取得（位置情報があるもののみ）
  const { data: members } = await supabase
    .from('profiles')
    .select('id, display_name, home_country, home_city, lat, lng')
    .eq('membership_status', 'active')
    .not('lat', 'is', null)
    .not('lng', 'is', null)

  // 枡拠点を取得
  const { data: hubs } = await supabase
    .from('masu_hubs')
    .select('*')
    .eq('is_active', true)

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-zinc-900 mb-2">Guild Map</h1>
      <p className="text-zinc-600 mb-6">
        Explore members and MASU Hubs around the world
      </p>

      <GuildMap members={members ?? []} hubs={hubs ?? []} />

      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-zinc-900 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">M</span>
          </div>
          <span className="text-zinc-600">Members ({members?.length ?? 0})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-amber-500 rounded flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span className="text-zinc-600">MASU Hubs ({hubs?.length ?? 0})</span>
        </div>
      </div>
    </div>
  )
}
