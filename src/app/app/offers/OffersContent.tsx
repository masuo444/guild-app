'use client'

import { useState } from 'react'
import { GuildQuest, QuestSubmission } from '@/types/database'
import { Card, CardContent } from '@/components/ui/Card'
import { QuestCard } from './QuestCard'
import { QuestSubmitModal } from './QuestSubmitModal'

type Tab = 'services' | 'quests'

interface OffersContentProps {
  quests: GuildQuest[]
  submissions: QuestSubmission[]
  userId: string
}

export function OffersContent({ quests, submissions, userId }: OffersContentProps) {
  const [activeTab, setActiveTab] = useState<Tab>('services')
  const [selectedQuest, setSelectedQuest] = useState<GuildQuest | null>(null)

  // アクティブなクエストのみ
  const activeQuests = quests.filter(q => q.is_active)

  return (
    <div>
      {/* タブ */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'services'
              ? 'bg-[#c0c0c0] text-zinc-900'
              : 'bg-white/10 text-zinc-300 hover:bg-white/20'
          }`}
        >
          FOMUSのサービス
        </button>
        <button
          onClick={() => setActiveTab('quests')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'quests'
              ? 'bg-[#c0c0c0] text-zinc-900'
              : 'bg-white/10 text-zinc-300 hover:bg-white/20'
          }`}
        >
          クエスト
          {activeQuests.length > 0 && (
            <span className={`px-1.5 py-0.5 rounded text-xs ${
              activeTab === 'quests' ? 'bg-zinc-900/20' : 'bg-amber-500/30 text-amber-300'
            }`}>
              {activeQuests.length}
            </span>
          )}
        </button>
      </div>

      {/* FOMUSのサービスタブ */}
      {activeTab === 'services' && (
        <div className="grid gap-4">
          <ServiceCard
            title="MASU Hub"
            description="MASUメンバーによるグローバルネットワーキング。各地のハブに参加して、仲間とつながろう。"
            link="/app/hubs"
          />
          <ServiceCard
            title="コミュニティ"
            description="メンバー限定のコミュニティスペース。情報交換やイベント情報をチェック。"
            link="/app/community"
          />
          <ServiceCard
            title="プロフィール"
            description="あなたのギルドメンバーシップを管理。ランクやポイントを確認できます。"
            link="/app/profile"
          />
        </div>
      )}

      {/* クエストタブ */}
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
                <p className="text-zinc-300">現在利用可能なクエストはありません</p>
                <p className="text-zinc-500 text-sm mt-1">新しいチャレンジをお楽しみに！</p>
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

function ServiceCard({
  title,
  description,
  link,
}: {
  title: string
  description: string
  link: string
}) {
  return (
    <a href={link} className="block">
      <Card className="hover:bg-white/5 transition-colors cursor-pointer">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#c0c0c0]/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-[#c0c0c0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1">{title}</h3>
              <p className="text-sm text-zinc-400">{description}</p>
            </div>
            <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </CardContent>
      </Card>
    </a>
  )
}
