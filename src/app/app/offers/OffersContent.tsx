'use client'

import { useState } from 'react'
import { GuildQuest, QuestSubmission } from '@/types/database'
import { Card, CardContent } from '@/components/ui/Card'
import { QuestCard } from './QuestCard'
import { QuestSubmitModal } from './QuestSubmitModal'
import { useLanguage } from '@/lib/i18n'

type Tab = 'services' | 'quests'

interface OffersContentProps {
  quests: GuildQuest[]
  submissions: QuestSubmission[]
  userId: string
}

// 優先度順（友達招待が最上位）
const QUEST_PRIORITY: Record<string, number> = {
  '友達をGuildに招待しよう': 1,
  'プロフィールを完成させよう': 2,
  'マップに自分を表示しよう': 3,
  '枡で乾杯！': 4,
  '枡のある日常': 5,
  'MASU Hubを訪問しよう': 6,
  'ギルドメンバーと乾杯！': 7,
  '世界のMASU': 8,
  'SILVAで遊ぼう': 9,
  'KUKUの世界を体験しよう': 10,
  'FOMUS PARUREを身につけよう': 11,
}

export function OffersContent({ quests, submissions, userId }: OffersContentProps) {
  const [activeTab, setActiveTab] = useState<Tab>('quests')
  const [selectedQuest, setSelectedQuest] = useState<GuildQuest | null>(null)
  const { t } = useLanguage()

  // アクティブなクエストのみ → クリア済み非リピータブルを除外 → 優先度順
  const activeQuests = quests
    .filter(q => q.is_active)
    .filter(q => {
      // リピータブルなクエストは常に表示
      if (q.is_repeatable) return true
      // 非リピータブル: 承認済みの投稿があれば非表示
      const hasApproved = submissions.some(s => s.quest_id === q.id && s.status === 'approved')
      return !hasApproved
    })
    .sort((a, b) => (QUEST_PRIORITY[a.title] || 99) - (QUEST_PRIORITY[b.title] || 99))

  return (
    <div>
      {/* タブ */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('quests')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'quests'
              ? 'bg-[#c0c0c0] text-zinc-900'
              : 'bg-white/10 text-zinc-300 hover:bg-white/20'
          }`}
        >
          {t.quests}
          {activeQuests.length > 0 && (
            <span className={`px-1.5 py-0.5 rounded text-xs ${
              activeTab === 'quests' ? 'bg-zinc-900/20' : 'bg-amber-500/30 text-amber-300'
            }`}>
              {activeQuests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'services'
              ? 'bg-[#c0c0c0] text-zinc-900'
              : 'bg-white/10 text-zinc-300 hover:bg-white/20'
          }`}
        >
          {t.fomusServices}
        </button>
      </div>

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
                <p className="text-zinc-300">{t.noQuestsAvailable}</p>
                <p className="text-zinc-500 text-sm mt-1">{t.stayTuned}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* FOMUSのサービスタブ */}
      {activeTab === 'services' && (
        <div className="grid gap-4">
          <ServiceCard
            title="Masu Photo"
            description={t.masuPhotoDesc}
            link="https://masuphoto.fomusglobal.com/"
            external
          />
          <ServiceCard
            title="FOMUS PARURE"
            description={t.fomusParureDesc}
            link="https://parure.fomus.jp/"
            external
          />
          <ServiceCard
            title="MASUKAME"
            description={t.masukameDesc}
          />
          <ServiceCard
            title="KUKU"
            description={t.kukuDesc}
            link="https://kuku.fomusglobal.com/"
            external
          />
          <ServiceCard
            title="SILVA"
            description={t.silvaDesc}
            link="https://silva.fomus.jp/"
            external
          />
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
  external = false,
}: {
  title: string
  description: string
  link?: string
  external?: boolean
}) {
  const content = (
    <Card className={link ? "hover:bg-white/5 transition-colors cursor-pointer" : ""}>
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
          {link && (
            external ? (
              <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )
          )}
        </div>
      </CardContent>
    </Card>
  )

  if (!link) {
    return <div className="block">{content}</div>
  }

  const linkProps = external
    ? { href: link, target: '_blank' as const, rel: 'noopener noreferrer' }
    : { href: link }

  return (
    <a {...linkProps} className="block">
      {content}
    </a>
  )
}
