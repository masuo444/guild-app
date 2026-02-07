'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GuildQuest, QuestSubmission } from '@/types/database'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n'

interface QuestSubmitModalProps {
  quest: GuildQuest
  submissions: QuestSubmission[]
  userId: string
  onClose: () => void
}

export function QuestSubmitModal({ quest, submissions, userId, onClose }: QuestSubmitModalProps) {
  const router = useRouter()
  const { language, t } = useLanguage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 言語に応じてタイトル・説明文を切り替え
  const title = (language === 'en' && quest.title_en) ? quest.title_en : quest.title
  const description = (language === 'en' && quest.description_en) ? quest.description_en : quest.description

  // このクエストの自分の過去投稿
  const mySubmissions = submissions.filter(s => s.quest_id === quest.id)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError(t.questErrorImageOnly)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(t.questErrorFileSize)
      return
    }

    setError(null)
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError(t.questErrorSelectImage)
      return
    }

    setUploading(true)
    setError(null)

    try {
      const supabase = createClient()

      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${userId}/${quest.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('quest-submissions')
        .upload(filePath, selectedFile)

      if (uploadError) {
        throw new Error(t.questErrorUploadFailed + ': ' + uploadError.message)
      }

      const { data: { publicUrl } } = supabase.storage
        .from('quest-submissions')
        .getPublicUrl(filePath)

      const { error: insertError } = await supabase
        .from('quest_submissions')
        .insert({
          quest_id: quest.id,
          user_id: userId,
          image_url: publicUrl,
          comment: comment || null,
          status: 'pending',
        })

      if (insertError) {
        throw new Error(t.questErrorSubmitFailed + ': ' + insertError.message)
      }

      router.refresh()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.questErrorGeneral)
    } finally {
      setUploading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-0.5 bg-green-500/20 rounded text-xs font-medium text-green-300">{t.questStatusApproved}</span>
      case 'rejected':
        return <span className="px-2 py-0.5 bg-red-500/20 rounded text-xs font-medium text-red-300">{t.questStatusRejected}</span>
      default:
        return <span className="px-2 py-0.5 bg-amber-500/20 rounded text-xs font-medium text-amber-300">{t.questStatusPending}</span>
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-zinc-400">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* ポイント報酬 */}
          <div className="flex items-center gap-2 p-3 bg-[#c0c0c0]/10 rounded-lg">
            <svg className="w-5 h-5 text-[#c0c0c0]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            <span className="text-[#c0c0c0] font-bold">+{quest.points_reward} {t.questPoints}</span>
            <span className="text-zinc-400 text-sm">{t.questOnApproval}</span>
          </div>

          {/* 画像アップロードエリア */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${dragActive ? 'border-[#c0c0c0] bg-[#c0c0c0]/10' : 'border-zinc-500/30 hover:border-zinc-400'}
              ${previewUrl ? 'border-green-500/50' : ''}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {previewUrl ? (
              <div className="space-y-3">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-48 mx-auto rounded-lg object-contain"
                />
                <p className="text-zinc-300 text-sm">{t.questClickToChange}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <svg className="w-12 h-12 mx-auto text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-zinc-300">{t.questDropImage}</p>
                <p className="text-zinc-500 text-xs">{t.questMaxFileSize}</p>
              </div>
            )}
          </div>

          {/* コメント入力 */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              {t.questCommentLabel}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t.questCommentPlaceholder}
              rows={2}
              className="w-full px-3 py-2 border border-zinc-500/30 rounded-lg text-sm bg-white/10 text-white placeholder-zinc-400 resize-none"
            />
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* 送信ボタン */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              {t.questCancel}
            </Button>
            <Button
              onClick={handleSubmit}
              loading={uploading}
              disabled={!selectedFile}
              className="flex-1"
            >
              {t.questSubmit}
            </Button>
          </div>

          {/* 過去の投稿履歴 */}
          {mySubmissions.length > 0 && (
            <div className="border-t border-zinc-500/30 pt-4">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">{t.questPreviousSubmissions}</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {mySubmissions.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                    {sub.image_url && (
                      <img
                        src={sub.image_url}
                        alt="Submission"
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(sub.status)}
                        <span className="text-zinc-500 text-xs">{formatDate(sub.created_at)}</span>
                      </div>
                      {sub.comment && (
                        <p className="text-zinc-400 text-xs truncate">{sub.comment}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
