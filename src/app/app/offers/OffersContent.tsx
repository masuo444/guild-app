'use client'

import { useState } from 'react'
import { GuildOffer, GuildQuest, QuestSubmission, Rank } from '@/types/database'
import { Card, CardContent } from '@/components/ui/Card'
import { QuestCard } from './QuestCard'
import { QuestSubmitModal } from './QuestSubmitModal'
import { RANK_ORDER } from '@/config/rank'

type Tab = 'offers' | 'quests'

interface OffersContentProps {
  offers: (GuildOffer & { profiles: { display_name: string } | null })[]
  quests: GuildQuest[]
  submissions: QuestSubmission[]
  userRank: Rank
  userId: string
}

export function OffersContent({ offers, quests, submissions, userRank, userId }: OffersContentProps) {
  const [activeTab, setActiveTab] = useState<Tab>('offers')
  const [selectedQuest, setSelectedQuest] = useState<GuildQuest | null>(null)

  // ランクでオファーをフィルタリング
  const userRankIndex = RANK_ORDER.indexOf(userRank)
  const accessibleOffers = offers.filter((offer) => {
    const offerRankIndex = RANK_ORDER.indexOf(offer.min_rank as Rank)
    return offerRankIndex <= userRankIndex
  })
  const lockedOffers = offers.filter((offer) => {
    const offerRankIndex = RANK_ORDER.indexOf(offer.min_rank as Rank)
    return offerRankIndex > userRankIndex
  })

  // アクティブなクエストのみ
  const activeQuests = quests.filter(q => q.is_active)

  return (
    <div>
      {/* タブ */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('offers')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'offers'
              ? 'bg-[#c0c0c0] text-zinc-900'
              : 'bg-white/10 text-zinc-300 hover:bg-white/20'
          }`}
        >
          Offers
        </button>
        <button
          onClick={() => setActiveTab('quests')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'quests'
              ? 'bg-[#c0c0c0] text-zinc-900'
              : 'bg-white/10 text-zinc-300 hover:bg-white/20'
          }`}
        >
          Quests
          {activeQuests.length > 0 && (
            <span className={`px-1.5 py-0.5 rounded text-xs ${
              activeTab === 'quests' ? 'bg-zinc-900/20' : 'bg-amber-500/30 text-amber-300'
            }`}>
              {activeQuests.length}
            </span>
          )}
        </button>
      </div>

      {/* Offersタブ */}
      {activeTab === 'offers' && (
        <div>
          {/* アクセス可能なオファー */}
          {accessibleOffers.length > 0 ? (
            <div className="grid gap-4 mb-8">
              {accessibleOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} locked={false} />
              ))}
            </div>
          ) : (
            <Card className="mb-8">
              <CardContent className="py-8 text-center">
                <p className="text-zinc-300">No offers available yet</p>
              </CardContent>
            </Card>
          )}

          {/* ロックされたオファー */}
          {lockedOffers.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-white mb-4">
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
      )}

      {/* Questsタブ */}
      {activeTab === 'quests' && (
        <div>
          {activeQuests.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {activeQuests.map((quest) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  submissions={submissions.filter(s => s.quest_id === quest.id)}
                  onSubmit={setSelectedQuest}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-zinc-300">No quests available yet</p>
                <p className="text-zinc-500 text-sm mt-1">Check back later for new challenges!</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 投稿モーダル */}
      {selectedQuest && (
        <QuestSubmitModal
          quest={selectedQuest}
          submissions={submissions.filter(s => s.user_id === userId)}
          userId={userId}
          onClose={() => setSelectedQuest(null)}
        />
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
        <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center">
            <svg
              className="w-8 h-8 text-zinc-300 mx-auto mb-2"
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
            <p className="text-sm font-medium text-zinc-300">
              Requires Rank {offer.min_rank}
            </p>
          </div>
        </div>
      )}
      <CardContent className="py-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-zinc-500/20 rounded text-xs font-medium text-zinc-300">
                {offer.offer_type}
              </span>
              <span className="px-2 py-0.5 bg-[#c0c0c0]/20 rounded text-xs font-medium text-[#c0c0c0]">
                Rank {offer.min_rank}+
              </span>
            </div>
            <h3 className="font-semibold text-white mb-1">{offer.title}</h3>
            <p className="text-sm text-zinc-300">{offer.description}</p>
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
