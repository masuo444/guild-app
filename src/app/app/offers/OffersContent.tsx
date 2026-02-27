'use client'

import { useState } from 'react'
import { GuildQuest, QuestSubmission, ExchangeItem, ExchangeOrder } from '@/types/database'
import { Card, CardContent } from '@/components/ui/Card'
import { QuestCard } from './QuestCard'
import { QuestSubmitModal } from './QuestSubmitModal'
import { useLanguage } from '@/lib/i18n'
import { formatDate } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { CARD_THEMES, THEME_OVERLAYS } from '@/components/membership/MembershipCard'

type Tab = 'services' | 'quests' | 'articles' | 'exchange'

interface ExchangeOrderWithItem extends ExchangeOrder {
  exchange_items: { name: string; name_en: string | null } | null
}

interface OffersContentProps {
  quests: GuildQuest[]
  submissions: QuestSubmission[]
  userId: string
  exchangeItems?: ExchangeItem[]
  exchangeOrders?: ExchangeOrderWithItem[]
  masuPoints?: number
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

export function OffersContent({ quests, submissions, userId, exchangeItems = [], exchangeOrders = [], masuPoints = 0 }: OffersContentProps) {
  const [activeTab, setActiveTab] = useState<Tab>('quests')
  const [selectedQuest, setSelectedQuest] = useState<GuildQuest | null>(null)
  const { language, t } = useLanguage()

  // アクティブなクエストのみ → クリア済み非リピータブルを除外 → 優先度順
  const activeQuests = quests
    .filter(q => q.is_active)
    .filter(q => {
      // リピータブルなクエストは常に表示
      if (q.is_repeatable) return true
      // 招待クエストは常に表示
      if (q.title === '友達をGuildに招待しよう') return true
      // 非リピータブル: 承認済みの投稿があれば非表示
      const hasApproved = submissions.some(s => s.quest_id === q.id && s.status === 'approved')
      return !hasApproved
    })
    .sort((a, b) => (QUEST_PRIORITY[a.title] || 99) - (QUEST_PRIORITY[b.title] || 99))

  return (
    <div>
      {/* カテゴリカード（2x2グリッド） */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {([
          { key: 'quests' as Tab, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', label: t.quests, badge: activeQuests.length > 0 ? activeQuests.length : null, color: 'green' },
          { key: 'exchange' as Tab, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: t.pointExchange, badge: null, color: 'amber' },
          { key: 'services' as Tab, icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: t.fomusServices, badge: null, color: 'blue' },
          { key: 'articles' as Tab, icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z', label: t.exclusiveArticles, badge: null, color: 'purple' },
        ]).map((tab) => {
          const colorMap = {
            green:  { active: 'bg-green-500/15 text-green-300 border-green-500/40', icon: 'text-green-400', badge: 'bg-green-500/30 text-green-300' },
            amber:  { active: 'bg-amber-500/15 text-amber-300 border-amber-500/40', icon: 'text-amber-400', badge: 'bg-amber-500/30 text-amber-300' },
            blue:   { active: 'bg-blue-500/15 text-blue-300 border-blue-500/40', icon: 'text-blue-400', badge: 'bg-blue-500/30 text-blue-300' },
            purple: { active: 'bg-purple-500/15 text-purple-300 border-purple-500/40', icon: 'text-purple-400', badge: 'bg-purple-500/30 text-purple-300' },
          }
          const c = colorMap[tab.color as keyof typeof colorMap]
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl text-sm font-medium transition-colors border ${
                activeTab === tab.key
                  ? c.active
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10 border-zinc-700/50'
              }`}
            >
              <svg className={`w-5 h-5 ${activeTab === tab.key ? c.icon : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span className="text-xs">{tab.label}</span>
              {tab.badge && (
                <span className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${c.badge}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
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

      {/* ポイント交換所タブ */}
      {activeTab === 'exchange' && (
        <ExchangeTab
          items={exchangeItems}
          orders={exchangeOrders}
          masuPoints={masuPoints}
          language={language}
        />
      )}

      {/* FOMUSのサービスタブ */}
      {activeTab === 'services' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ServiceCard
            title="FOMUS"
            description={t.fomusDesc}
            image="/services/fomus.png"
            link="https://www.fomus.jp/"
            external
          />
          <ServiceCard
            title="MASU"
            description={t.masuDesc}
            image="/services/masu.png"
            link="https://www.fomus.jp/"
            external
          />
          <ServiceCard
            title="Masu Photo"
            description={t.masuPhotoDesc}
            image="/services/masu-photo.png"
            link="https://masuphoto.fomusglobal.com/"
            external
          />
          <ServiceCard
            title="FOMUS PARURE"
            description={t.fomusParureDesc}
            image="/services/fomus-parure.png"
            link="https://parure.fomus.jp/"
            external
          />
          <ServiceCard
            title="MASUKAME"
            description={t.masukameDesc}
            image="/services/masukame.jpg"
          />
          <ServiceCard
            title="KUKU"
            description={t.kukuDesc}
            image="/services/kuku.jpg"
            link="https://kuku.fomusglobal.com/"
            external
          />
          <ServiceCard
            title="SILVA"
            description={t.silvaDesc}
            image="/services/silva.png"
            link="https://silva.fomus.jp/"
            external
          />
          <ServiceCard
            title="Architecture"
            description={t.architectureDesc}
            image="/services/architecture.png"
          />
          <ServiceCard
            title="Sagishima Art Gallery"
            description={t.sagishimaDesc}
            image="/services/sagishima.png"
            link="https://sagishimagallery.fomus.jp/"
            external
          />
        </div>
      )}

      {/* 限定記事タブ */}
      {activeTab === 'articles' && (
        <div>
          <Card className="overflow-hidden">
            {/* サムネイル画像（後ほど配置） */}
            <div className="aspect-video overflow-hidden bg-gradient-to-br from-purple-900/50 to-indigo-900/50">
              <img
                src="/articles/massu-thumbnail.jpg"
                alt={language === 'ja' ? 'まっすー海外活動記' : 'MaSU Overseas Activities'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const el = e.currentTarget
                  el.style.display = 'none'
                  el.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-16 h-16 text-purple-400/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg></div>'
                }}
              />
            </div>
            <CardContent className="py-5">
              <h3 className="text-lg font-bold text-white mb-2">
                {language === 'ja' ? 'まっすー海外活動記' : 'MaSU Overseas Activities'}
              </h3>

              {/* パスワード案内 */}
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 mb-4">
                <p className="text-sm text-purple-200 mb-1.5">{t.articlePasswordNote}</p>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs text-zinc-400">Password:</span>
                  <code className="px-2 py-0.5 bg-white/10 rounded text-sm font-mono text-white">{t.articlePasswordValue}</code>
                </div>
                <p className="text-xs text-red-400">{t.articlePasswordWarning}</p>
              </div>

              {/* 記事を読むボタン */}
              <a
                href="https://masu-blog.fomus.jp/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {t.articleReadButton}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </CardContent>
          </Card>
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

function ExchangeTab({
  items,
  orders,
  masuPoints,
  language,
}: {
  items: ExchangeItem[]
  orders: ExchangeOrderWithItem[]
  masuPoints: number
  language: string
}) {
  const { t } = useLanguage()
  const router = useRouter()
  const [exchanging, setExchanging] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleExchange = async (item: ExchangeItem) => {
    if (masuPoints < item.points_cost) {
      setError(t.exchangeInsufficientPoints)
      setTimeout(() => setError(null), 3000)
      return
    }
    if (item.stock === 0) {
      setError(t.exchangeOutOfStock)
      setTimeout(() => setError(null), 3000)
      return
    }

    if (!confirm(t.exchangeConfirm)) return

    setExchanging(item.id)
    setError(null)
    try {
      const res = await fetch('/api/exchange/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: item.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error')
      } else {
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          router.refresh()
        }, 2000)
      }
    } catch {
      setError('Network error')
    } finally {
      setExchanging(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-300'
      case 'approved': return 'bg-green-500/20 text-green-300'
      case 'rejected': return 'bg-red-500/20 text-red-300'
      case 'canceled': return 'bg-zinc-500/20 text-zinc-300'
      default: return 'bg-zinc-500/20 text-zinc-300'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return t.exchangeStatusPending
      case 'approved': return t.exchangeStatusApproved
      case 'rejected': return t.exchangeStatusRejected
      case 'canceled': return t.exchangeStatusCanceled
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      {/* 残高表示 */}
      <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/10 rounded-xl p-4 border border-amber-500/20">
        <p className="text-amber-300 text-xs font-medium mb-1">{t.exchangeBalance}</p>
        <p className="text-3xl font-bold text-white">{masuPoints.toLocaleString()} <span className="text-sm font-normal text-amber-300">pt</span></p>
      </div>

      {/* 通知 */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-300 text-sm">
          {t.exchangeSuccess}
        </div>
      )}

      {/* アイテム一覧 */}
      {items.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => {
            const itemName = language === 'en' && item.name_en ? item.name_en : item.name
            const itemDesc = language === 'en' && item.description_en ? item.description_en : item.description
            const canAfford = masuPoints >= item.points_cost
            const inStock = item.stock !== 0
            const themeKey = item.coupon_code?.startsWith('theme:') ? item.coupon_code.replace('theme:', '') : null
            const themeColors = themeKey ? CARD_THEMES[themeKey] : null
            const ThemeOverlay = themeKey ? THEME_OVERLAYS[themeKey] : null
            const isOwned = themeKey && orders.some(o => o.exchange_items?.name === item.name && (o.status === 'approved' || o.status === 'pending'))

            return (
              <Card key={item.id}>
                <CardContent className="py-4">
                  <div className="flex flex-col gap-3">
                    {/* 商品画像（非テーマアイテム） */}
                    {!themeColors && item.image_url && (
                      <div className="aspect-[1.586/1] rounded-lg overflow-hidden">
                        <img
                          src={item.image_url}
                          alt={itemName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    {/* テーマプレビュー */}
                    {themeColors && (
                      <div
                        className="relative aspect-[1.586/1] rounded-lg overflow-hidden border border-white/10"
                      >
                        {/* 背景グラデーション */}
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(135deg, ${themeColors.bgFrom} 0%, ${themeColors.bgTo} 50%, ${themeColors.bgFrom} 100%)`,
                          }}
                        />
                        {/* グロー */}
                        <div
                          className="absolute inset-0 opacity-20"
                          style={{
                            background: `radial-gradient(ellipse at top right, ${themeColors.primary}, transparent, transparent)`,
                          }}
                        />
                        {/* オーバーレイ */}
                        {ThemeOverlay && <ThemeOverlay />}
                        {/* コーナー装飾 */}
                        <div className="absolute top-1.5 left-1.5 w-5 h-5 pointer-events-none">
                          <svg viewBox="0 0 32 32" className="w-full h-full">
                            <path d="M2 12 L2 2 L12 2" fill="none" stroke={themeColors.primary} strokeWidth="2" strokeLinecap="round" />
                            <circle cx="2" cy="2" r="1.5" fill={themeColors.primary} />
                          </svg>
                        </div>
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 pointer-events-none">
                          <svg viewBox="0 0 32 32" className="w-full h-full" style={{ transform: 'scale(-1, 1)' }}>
                            <path d="M2 12 L2 2 L12 2" fill="none" stroke={themeColors.primary} strokeWidth="2" strokeLinecap="round" />
                            <circle cx="2" cy="2" r="1.5" fill={themeColors.primary} />
                          </svg>
                        </div>
                        <div className="absolute bottom-1.5 left-1.5 w-5 h-5 pointer-events-none">
                          <svg viewBox="0 0 32 32" className="w-full h-full" style={{ transform: 'scale(1, -1)' }}>
                            <path d="M2 12 L2 2 L12 2" fill="none" stroke={themeColors.primary} strokeWidth="2" strokeLinecap="round" />
                            <circle cx="2" cy="2" r="1.5" fill={themeColors.primary} />
                          </svg>
                        </div>
                        <div className="absolute bottom-1.5 right-1.5 w-5 h-5 pointer-events-none">
                          <svg viewBox="0 0 32 32" className="w-full h-full" style={{ transform: 'scale(-1, -1)' }}>
                            <path d="M2 12 L2 2 L12 2" fill="none" stroke={themeColors.primary} strokeWidth="2" strokeLinecap="round" />
                            <circle cx="2" cy="2" r="1.5" fill={themeColors.primary} />
                          </svg>
                        </div>
                        {/* カードテキスト（サンプル） */}
                        <div className="relative z-10 h-full p-3 flex flex-col justify-between">
                          <div>
                            <p className="text-[#f5e6d3] font-bold text-xs tracking-wider" style={{ fontFamily: 'serif' }}>
                              FOMUS GUILD
                            </p>
                            <p className="text-[#a89984] text-[8px] uppercase tracking-[0.15em]">
                              Guild Member
                            </p>
                          </div>
                          <div>
                            <p className="text-[#f5e6d3] text-sm font-light tracking-wide" style={{ fontFamily: 'serif' }}>
                              Your Name
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <div className="w-6 h-px" style={{ background: `linear-gradient(to right, ${themeColors.primary}99, transparent)` }} />
                              <p className="text-[#6b5b4f] font-mono text-[8px]">FG-XXXX-XXXX</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-lg font-light" style={{ fontFamily: 'serif', color: themeColors.primary }}>
                              1,234
                              <span className="text-[#6b5b4f] text-[10px] ml-0.5">EXP</span>
                            </p>
                          </div>
                        </div>
                        {/* カードエッジ */}
                        <div className="absolute inset-0 rounded-lg" style={{ border: `1px solid ${themeColors.primary}33` }} />
                        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${themeColors.primary}66, transparent)` }} />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-white mb-1">{itemName}</h3>
                      {itemDesc && <p className="text-sm text-zinc-400">{itemDesc}</p>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-amber-300 font-bold">{item.points_cost} pt</span>
                      {isOwned ? (
                        <span className="px-4 py-2 rounded-lg text-sm font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                          {t.exchangeOwned}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleExchange(item)}
                          disabled={!canAfford || !inStock || exchanging === item.id}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            canAfford && inStock
                              ? 'bg-amber-500 text-black hover:bg-amber-400'
                              : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                          }`}
                        >
                          {exchanging === item.id ? '...' : t.exchangeButton}
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-zinc-300">{t.pointExchangeComingSoon}</p>
            <p className="text-zinc-500 text-sm mt-1">{t.pointExchangeStayTuned}</p>
          </CardContent>
        </Card>
      )}

      {/* 交換履歴 */}
      {orders.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-3">{t.exchangeHistory}</h3>
          <div className="space-y-2">
            {orders.map((order) => {
              const orderItemName = language === 'en' && order.exchange_items?.name_en
                ? order.exchange_items.name_en
                : order.exchange_items?.name || '—'

              return (
                <div key={order.id} className="bg-white/5 rounded-lg p-3 border border-zinc-700/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white text-sm font-medium">{orderItemName}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                      <p className="text-amber-300 text-sm mt-1">-{order.points_spent} pt</p>
                    </div>
                  </div>
                  {order.status === 'approved' && order.coupon_code && (
                    <div className="mt-2 p-2 bg-green-500/10 rounded border border-green-500/20">
                      <p className="text-green-300 text-xs font-medium">{t.exchangeCouponCode}</p>
                      <p className="text-green-200 text-sm font-mono mt-0.5">{order.coupon_code}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function ServiceCard({
  title,
  description,
  image,
  link,
  external = false,
}: {
  title: string
  description: string
  image?: string
  link?: string
  external?: boolean
}) {
  const content = (
    <Card className={`overflow-hidden ${link ? "hover:bg-white/5 transition-colors cursor-pointer" : ""}`}>
      {image && (
        <div className="aspect-square overflow-hidden">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white mb-1">{title}</h3>
            <p className="text-sm text-zinc-400 line-clamp-3">{description}</p>
          </div>
          {link && (
            external ? (
              <svg className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
