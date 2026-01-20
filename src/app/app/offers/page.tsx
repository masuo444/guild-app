import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { calculateRank, RANK_ORDER } from '@/config/rank'
import { GuildOffer, Rank } from '@/types/database'

export default async function OffersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // ユーザーのポイントとランクを取得
  const { data: logs } = await supabase
    .from('activity_logs')
    .select('points')
    .eq('user_id', user.id)

  const totalPoints = logs?.reduce((sum, log) => sum + log.points, 0) ?? 0
  const userRank = calculateRank(totalPoints)

  // アクティブなオファーを取得
  const { data: offers } = await supabase
    .from('guild_offers')
    .select('*, profiles:provider_id(display_name)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // ランクでフィルタリング（ユーザーのランク以下のみ表示）
  const userRankIndex = RANK_ORDER.indexOf(userRank)
  const accessibleOffers = offers?.filter((offer) => {
    const offerRankIndex = RANK_ORDER.indexOf(offer.min_rank as Rank)
    return offerRankIndex <= userRankIndex
  })

  const lockedOffers = offers?.filter((offer) => {
    const offerRankIndex = RANK_ORDER.indexOf(offer.min_rank as Rank)
    return offerRankIndex > userRankIndex
  })

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-zinc-900 mb-2">Guild Offers</h1>
      <p className="text-zinc-600 mb-6">
        Exclusive benefits available to members (Your Rank: {userRank})
      </p>

      {/* アクセス可能なオファー */}
      {accessibleOffers && accessibleOffers.length > 0 ? (
        <div className="grid gap-4 mb-8">
          {accessibleOffers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} locked={false} />
          ))}
        </div>
      ) : (
        <Card className="mb-8">
          <CardContent className="py-8 text-center">
            <p className="text-zinc-500">No offers available yet</p>
          </CardContent>
        </Card>
      )}

      {/* ロックされたオファー */}
      {lockedOffers && lockedOffers.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            Unlock with Higher Rank
          </h2>
          <div className="grid gap-4 opacity-60">
            {lockedOffers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} locked={true} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function OfferCard({
  offer,
  locked,
}: {
  offer: GuildOffer & { profiles: { display_name: string } | null }
  locked: boolean
}) {
  return (
    <Card className={locked ? 'relative overflow-hidden' : ''}>
      {locked && (
        <div className="absolute inset-0 bg-zinc-100/50 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center">
            <svg
              className="w-8 h-8 text-zinc-400 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <p className="text-sm font-medium text-zinc-600">
              Requires Rank {offer.min_rank}
            </p>
          </div>
        </div>
      )}
      <CardContent className="py-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-zinc-100 rounded text-xs font-medium text-zinc-600">
                {offer.offer_type}
              </span>
              <span className="px-2 py-0.5 bg-amber-100 rounded text-xs font-medium text-amber-700">
                Rank {offer.min_rank}+
              </span>
            </div>
            <h3 className="font-semibold text-zinc-900 mb-1">{offer.title}</h3>
            <p className="text-sm text-zinc-600">{offer.description}</p>
            {offer.profiles?.display_name && (
              <p className="text-xs text-zinc-400 mt-2">
                By {offer.profiles.display_name}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
