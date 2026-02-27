'use client'

import { useState, useEffect } from 'react'
import { GuildQuest, QuestSubmission } from '@/types/database'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { generateInviteCode } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n'

interface InviteQuestCardProps {
  quest: GuildQuest
  submissions: QuestSubmission[]
  userId: string
}

export function InviteQuestCard({ quest, submissions, userId }: InviteQuestCardProps) {
  const { language, t } = useLanguage()
  const [creating, setCreating] = useState(false)
  const [activeInvite, setActiveInvite] = useState<{ code: string; use_count: number } | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [copied, setCopied] = useState(false)

  const approvedCount = submissions.filter(s => s.status === 'approved').length

  const title = (language === 'en' && quest.title_en) ? quest.title_en : quest.title
  const description = (language === 'en' && quest.description_en) ? quest.description_en : quest.description

  const questTypeLabel = quest.quest_type === 'photo'
    ? t.questTypePhoto
    : quest.quest_type === 'checkin'
      ? t.questTypeCheckin
      : t.questTypeAction

  // ユーザーのアクティブな招待コードを取得
  useEffect(() => {
    const loadInvite = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('invites')
        .select('code, use_count')
        .eq('invited_by', userId)
        .eq('reusable', true)
        .order('created_at', { ascending: false })
        .limit(1)

      if (data && data.length > 0 && (data[0].use_count || 0) < 10) {
        setActiveInvite({ code: data[0].code, use_count: data[0].use_count || 0 })
      }
      setLoaded(true)
    }
    loadInvite()
  }, [userId])

  const handleCreate = async () => {
    setCreating(true)
    const supabase = createClient()
    const code = generateInviteCode()

    const { data, error } = await supabase.from('invites').insert({
      code,
      invited_by: userId,
      used: false,
      membership_type: 'standard',
      reusable: true,
    }).select().single()

    setCreating(false)

    if (error) {
      console.error('Invite creation error:', error)
    } else if (data) {
      setActiveInvite({ code: data.code, use_count: 0 })
      // クリップボードにコピー
      const url = `${window.location.origin}/invite/${data.code}`
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCopy = () => {
    if (!activeInvite) return
    const url = `${window.location.origin}/invite/${activeInvite.code}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="overflow-hidden">
      {quest.image_url && (
        <div className="aspect-video relative">
          <img src={quest.image_url} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
      <CardContent className="py-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-amber-500/20 rounded text-xs font-medium text-amber-300">
                {questTypeLabel}
              </span>
              {quest.is_repeatable && (
                <span className="px-2 py-0.5 bg-green-500/20 rounded text-xs font-medium text-green-300">
                  {t.questRepeatable}
                </span>
              )}
            </div>

            <h3 className="font-semibold text-white text-lg mb-1">{title}</h3>
            <p className="text-sm text-zinc-300 mb-3">{description}</p>

            <div className="flex items-center gap-1 mb-3">
              <svg className="w-5 h-5 text-[#c0c0c0]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              <span className="text-[#c0c0c0] font-bold text-lg">+{quest.points_reward}</span>
              <span className="text-zinc-400 text-sm ml-1">{t.questPoints}</span>
              <span className="text-zinc-500 text-xs ml-1">({t.questOnApproval})</span>
            </div>

            {approvedCount > 0 && (
              <div className="text-xs text-green-400 mb-3">
                {approvedCount} {t.questCompleted}
              </div>
            )}
          </div>
        </div>

        {/* 招待リンクセクション */}
        {loaded && (
          <div className="border-t border-zinc-500/30 pt-4 mt-2">
            {activeInvite ? (
              <div className="space-y-3">
                {/* 招待リンク表示 */}
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-zinc-500/30"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <svg className="w-4 h-4 text-zinc-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span className="text-xs text-white truncate">
                      {typeof window !== 'undefined' ? `${window.location.origin}/invite/${activeInvite.code}` : activeInvite.code}
                    </span>
                  </div>
                  <span className="text-xs text-green-400 flex-shrink-0 ml-2">
                    {copied ? t.copied : t.copyLink}
                  </span>
                </button>

                {/* 使用状況 */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">
                    {t.inviteUsage.replace('{count}', String(activeInvite.use_count))}
                  </span>
                  {activeInvite.use_count >= 10 ? (
                    <span className="text-xs text-red-400">{t.inviteMaxReached}</span>
                  ) : null}
                </div>

                {/* 上限到達時は新規作成ボタン */}
                {activeInvite.use_count >= 10 && (
                  <Button onClick={handleCreate} loading={creating} className="w-full" size="sm">
                    {t.inviteNewCode}
                  </Button>
                )}
              </div>
            ) : (
              <Button onClick={handleCreate} loading={creating} className="w-full">
                {t.inviteCreateLink}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
