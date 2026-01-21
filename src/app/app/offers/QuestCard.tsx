'use client'

import { GuildQuest, QuestSubmission } from '@/types/database'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface QuestCardProps {
  quest: GuildQuest
  submissions: QuestSubmission[]
  onSubmit: (quest: GuildQuest) => void
}

export function QuestCard({ quest, submissions, onSubmit }: QuestCardProps) {
  // このクエストの承認済み投稿数
  const approvedCount = submissions.filter(s => s.status === 'approved').length
  // このクエストの審査中投稿数
  const pendingCount = submissions.filter(s => s.status === 'pending').length

  return (
    <Card className="overflow-hidden">
      {quest.image_url && (
        <div className="aspect-video relative">
          <img
            src={quest.image_url}
            alt={quest.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardContent className="py-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            {/* クエストタイプバッジ */}
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-amber-500/20 rounded text-xs font-medium text-amber-300">
                {quest.quest_type === 'photo' ? 'Photo Quest' : quest.quest_type === 'checkin' ? 'Check-in' : 'Action'}
              </span>
              {quest.is_repeatable && (
                <span className="px-2 py-0.5 bg-green-500/20 rounded text-xs font-medium text-green-300">
                  Repeatable
                </span>
              )}
            </div>

            {/* タイトル */}
            <h3 className="font-semibold text-white text-lg mb-1">{quest.title}</h3>

            {/* 説明 */}
            <p className="text-sm text-zinc-300 mb-3">{quest.description}</p>

            {/* ポイント報酬 */}
            <div className="flex items-center gap-1 mb-3">
              <svg className="w-5 h-5 text-[#c0c0c0]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              <span className="text-[#c0c0c0] font-bold text-lg">+{quest.points_reward}</span>
              <span className="text-zinc-400 text-sm ml-1">points</span>
            </div>

            {/* 投稿状況 */}
            {(approvedCount > 0 || pendingCount > 0) && (
              <div className="flex gap-3 text-xs mb-3">
                {approvedCount > 0 && (
                  <span className="text-green-400">
                    {approvedCount} completed
                  </span>
                )}
                {pendingCount > 0 && (
                  <span className="text-amber-400">
                    {pendingCount} pending review
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 挑戦ボタン */}
        <Button
          onClick={() => onSubmit(quest)}
          className="w-full"
          variant="primary"
        >
          {quest.quest_type === 'photo' ? 'Submit Photo' : 'Challenge'}
        </Button>
      </CardContent>
    </Card>
  )
}
