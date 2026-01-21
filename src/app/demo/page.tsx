'use client'

import { useState, useEffect, useRef } from 'react'
import { MembershipCard } from '@/components/membership/MembershipCard'
import type { Profile } from '@/types/database'
import { LanguageProvider, useLanguage, Language } from '@/lib/i18n'

// 言語切り替えボタン（ギルドテーマ）
function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex items-center gap-1 bg-[#2a2420] rounded-lg p-0.5 border border-[#d4af37]/20">
      <button
        onClick={() => setLanguage('ja')}
        className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
          language === 'ja'
            ? 'bg-[#3a332e] text-[#d4af37] shadow-sm'
            : 'text-[#6b5b4f] hover:text-[#a89984]'
        }`}
      >
        日本語
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
          language === 'en'
            ? 'bg-[#3a332e] text-[#d4af37] shadow-sm'
            : 'text-[#6b5b4f] hover:text-[#a89984]'
        }`}
      >
        EN
      </button>
    </div>
  )
}

// デモ用マップコンポーネント
function DemoMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      // Google Maps API key not configured - silently return
      return
    }

    // Google Maps スクリプトが既に読み込まれているか確認
    if (window.google?.maps) {
      initMap()
      return
    }

    // スクリプトを動的に読み込み
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
    script.async = true
    script.onload = initMap
    document.head.appendChild(script)

    function initMap() {
      if (!mapRef.current || !window.google?.maps) return

      // ダークスタイルのマップ
      const darkMapStyles = [
        { elementType: 'geometry', stylers: [{ color: '#1a1614' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1614' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#6b5b4f' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#2a2420' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2420' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#3a332e' }] },
      ]

      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 35.6762, lng: 139.6503 },
        zoom: 3,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'greedy',
        styles: darkMapStyles,
      })

      // デモ用のマーカー（メンバー）
      const members = [
        { lat: 35.6762, lng: 139.6503, name: 'Tokyo' },
        { lat: 34.6937, lng: 135.5023, name: 'Osaka' },
        { lat: 40.7128, lng: -74.0060, name: 'New York' },
        { lat: 51.5074, lng: -0.1278, name: 'London' },
        { lat: -33.8688, lng: 151.2093, name: 'Sydney' },
        { lat: 48.8566, lng: 2.3522, name: 'Paris' },
      ]

      members.forEach((member) => {
        new window.google.maps.Marker({
          position: { lat: member.lat, lng: member.lng },
          map,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#d4af37',
            fillOpacity: 1,
            strokeColor: '#f5e6d3',
            strokeWeight: 2,
          },
          title: member.name,
        })
      })

      // デモ用のマーカー（Hub）
      const hubs = [
        { lat: 35.6812, lng: 139.7671, name: 'MASU Hub Tokyo' },
        { lat: 13.7563, lng: 100.5018, name: 'MASU Hub Bangkok' },
      ]

      hubs.forEach((hub) => {
        new window.google.maps.Marker({
          position: { lat: hub.lat, lng: hub.lng },
          map,
          icon: {
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
            scale: 1.5,
            fillColor: '#d4af37',
            fillOpacity: 1,
            strokeColor: '#f5e6d3',
            strokeWeight: 1,
            anchor: new window.google.maps.Point(12, 24),
          },
          title: hub.name,
        })
      })

      setMapLoaded(true)
    }
  }, [])

  return (
    <div className="relative">
      <div ref={mapRef} className="h-[60vh] w-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1614]">
          <div className="animate-spin w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full" />
        </div>
      )}
      {/* 凡例 */}
      <div className="absolute bottom-4 left-4 bg-[#2a2420]/95 backdrop-blur rounded-lg p-3 shadow-lg border border-[#d4af37]/20">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-[#d4af37] rounded-full border-2 border-[#f5e6d3]" />
            <span className="text-[#f5e6d3]">{t.members}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-[#d4af37] rounded-sm" />
            <span className="text-[#f5e6d3]">{t.hubs}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

declare global {
  interface Window {
    google: typeof google
  }
}

// デモ用のモックデータ
const mockProfile: Profile = {
  id: 'demo-user-id',
  membership_id: 'FOMUS-DEMO-001',
  display_name: 'Demo User',
  home_country: 'Japan',
  home_city: 'Tokyo',
  lat: 35.6762,
  lng: 139.6503,
  membership_status: 'active',
  membership_type: 'standard',
  subscription_status: 'active',
  stripe_customer_id: null,
  stripe_subscription_id: null,
  role: 'admin',
  instagram_id: null,
  show_location_on_map: true,
  created_at: '2024-01-01T00:00:00Z',
}

const mockPoints = 450

// 装飾的なセクションヘッダー
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-2 h-2 bg-[#d4af37] rotate-45" />
      <h2 className="font-semibold text-[#f5e6d3]" style={{ fontFamily: 'serif' }}>{title}</h2>
      <div className="flex-1 h-px bg-gradient-to-r from-[#d4af37]/30 to-transparent" />
    </div>
  )
}

function DemoPageContent() {
  const [activeTab, setActiveTab] = useState<'card' | 'map' | 'offers' | 'profile' | 'admin'>('card')
  const { t, language } = useLanguage()

  const cardTranslations = {
    guildMember: t.guildMember,
    memberSince: t.memberSince,
    points: t.points,
    rank: t.rank,
  }

  const activityItems = [
    { action: t.hubCheckin, points: 50, date: '2024-01-15' },
    { action: t.eventAttendance, points: 100, date: '2024-01-10' },
    { action: t.welcomeBonus, points: 100, date: '2024-01-01' },
  ]

  const offerItems = [
    { title: t.partnerCafeDiscount, minRank: 'D', description: t.showMemberCard },
    { title: t.freeCoworkingPass, minRank: 'C', description: t.validAtAllHubs },
    { title: t.exclusiveEventAccess, minRank: 'B', description: t.priorityAccess },
    { title: t.vipLoungeAccess, minRank: 'A', description: t.premiumFacilities },
  ]

  return (
    <div className="min-h-screen bg-[#1a1614]">
      {/* ヘッダー */}
      <header className="bg-gradient-to-b from-[#2a2420] to-[#1a1614] border-b border-[#d4af37]/20 px-4 py-3 sticky top-0 z-50">
        {/* 上部の装飾ライン */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* ミニエンブレム */}
            <svg viewBox="0 0 24 24" className="w-6 h-6">
              <path
                d="M12 2 L20 6 L20 12 C20 18 12 22 12 22 C12 22 4 18 4 12 L4 6 L12 2 Z"
                fill="#2a2420"
                stroke="#d4af37"
                strokeWidth="1.5"
              />
              <text x="12" y="14" textAnchor="middle" fill="#d4af37" fontSize="6" fontWeight="bold">FG</text>
            </svg>
            <h1 className="text-lg font-bold text-[#f5e6d3]" style={{ fontFamily: 'serif' }}>FOMUS GUILD</h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <span className="text-xs bg-gradient-to-r from-[#b8860b] to-[#d4af37] text-[#1a1614] px-3 py-1 rounded-full font-medium">
              {t.rank} C
            </span>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="pb-20">
        {activeTab === 'card' && (
          <div className="p-4">
            <MembershipCard
              profile={mockProfile}
              points={mockPoints}
              translations={cardTranslations}
            />

            {/* ポイント履歴 */}
            <div className="mt-6 bg-[#2a2420] rounded-xl p-4 border border-[#d4af37]/20">
              <SectionHeader title={t.recentActivity} />
              <div className="space-y-3">
                {activityItems.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-[#3a332e] last:border-0">
                    <div>
                      <p className="text-sm font-medium text-[#f5e6d3]">{item.action}</p>
                      <p className="text-xs text-[#6b5b4f]">{item.date}</p>
                    </div>
                    <span className="text-sm font-semibold text-[#d4af37]">+{item.points}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="p-4">
            <div className="bg-[#2a2420] rounded-xl overflow-hidden border border-[#d4af37]/20">
              <DemoMap />
            </div>

            {/* 統計 */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-[#2a2420] rounded-xl p-4 border border-[#d4af37]/20 text-center">
                <p className="text-2xl font-bold text-[#d4af37]" style={{ fontFamily: 'serif' }}>127</p>
                <p className="text-xs text-[#6b5b4f]">{t.members}</p>
              </div>
              <div className="bg-[#2a2420] rounded-xl p-4 border border-[#d4af37]/20 text-center">
                <p className="text-2xl font-bold text-[#d4af37]" style={{ fontFamily: 'serif' }}>8</p>
                <p className="text-xs text-[#6b5b4f]">{t.hubs}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="p-4 space-y-4">
            <SectionHeader title={t.guildOffers} />

            {offerItems.map((offer, i) => (
              <div key={i} className="bg-[#2a2420] rounded-xl p-4 border border-[#d4af37]/20">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-[#f5e6d3]">{offer.title}</h3>
                    <p className="text-sm text-[#6b5b4f] mt-1">{offer.description}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    ['D', 'C'].includes(offer.minRank)
                      ? 'bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30'
                      : 'bg-[#3a332e] text-[#6b5b4f] border border-[#3a332e]'
                  }`}>
                    {t.rank} {offer.minRank}+
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="p-4 space-y-4">
            {/* プロフィールヘッダー */}
            <div className="bg-[#2a2420] rounded-xl p-6 border border-[#d4af37]/20 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#b8860b] to-[#d4af37] rounded-full mx-auto mb-3 flex items-center justify-center border-2 border-[#d4af37]">
                <span className="text-2xl font-bold text-[#1a1614]">D</span>
              </div>
              <h2 className="font-semibold text-[#f5e6d3]" style={{ fontFamily: 'serif' }}>{mockProfile.display_name}</h2>
              <p className="text-sm text-[#6b5b4f]">{mockProfile.home_city}, {mockProfile.home_country}</p>
              <p className="text-xs text-[#4a4540] mt-2">{t.memberSinceDate} Jan 2024</p>
            </div>

            {/* ランク進捗 */}
            <div className="bg-[#2a2420] rounded-xl p-4 border border-[#d4af37]/20">
              <SectionHeader title={t.rankProgress} />
              <div className="flex justify-between text-xs text-[#6b5b4f] mb-2">
                <span>{t.rank} C</span>
                <span>{t.rank} B (300 pts)</span>
              </div>
              <div className="h-2 bg-[#3a332e] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#b8860b] to-[#d4af37] rounded-full" style={{ width: '75%' }} />
              </div>
              <p className="text-xs text-[#6b5b4f] mt-2 text-center">150 {t.pointsToNextRank}</p>
            </div>

            {/* アクション */}
            <div className="space-y-2">
              <button className="w-full bg-[#2a2420] rounded-xl p-4 border border-[#d4af37]/20 text-left flex justify-between items-center hover:bg-[#3a332e] transition-colors">
                <span className="text-[#f5e6d3]">{t.editProfile}</span>
                <svg className="w-5 h-5 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button className="w-full bg-[#2a2420] rounded-xl p-4 border border-[#d4af37]/20 text-left flex justify-between items-center hover:bg-[#3a332e] transition-colors">
                <span className="text-[#f5e6d3]">{t.manageSubscription}</span>
                <svg className="w-5 h-5 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button className="w-full bg-[#3a2420] rounded-xl p-4 border border-red-900/30 text-left hover:bg-[#4a2420] transition-colors">
                <span className="text-red-400">{t.signOut}</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="p-4 space-y-4">
            <SectionHeader title={t.adminPanel} />

            {/* タブ */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[t.invites, t.members, t.hubs, t.offers].map((tab) => (
                <button
                  key={tab}
                  className="px-4 py-2 bg-[#2a2420] rounded-lg text-sm font-medium text-[#a89984] whitespace-nowrap border border-[#d4af37]/20 hover:bg-[#3a332e] hover:text-[#d4af37] transition-colors"
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* 招待コード管理 */}
            <div className="bg-[#2a2420] rounded-xl p-4 border border-[#d4af37]/20">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-[#f5e6d3]">{t.inviteCodes}</h3>
                <button className="text-sm bg-gradient-to-r from-[#b8860b] to-[#d4af37] text-[#1a1614] px-3 py-1.5 rounded-lg font-medium hover:opacity-90 transition-opacity">
                  {t.generate}
                </button>
              </div>
              <div className="space-y-2">
                {[
                  { code: 'FOMUS2026', used: false },
                  { code: 'GUILD-ABC', used: true },
                  { code: 'MEMBER-XYZ', used: true },
                ].map((invite, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-[#1a1614] rounded-lg border border-[#3a332e]">
                    <code className="text-sm font-mono text-[#f5e6d3]">{invite.code}</code>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      invite.used
                        ? 'bg-[#3a332e] text-[#6b5b4f]'
                        : 'bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30'
                    }`}>
                      {invite.used ? t.used : t.available}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#1a1614] to-[#2a2420] border-t border-[#d4af37]/20 px-2 py-2 safe-area-bottom">
        {/* 上部の装飾ライン */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />

        <div className="flex justify-around">
          {[
            { id: 'card', label: t.card, icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2' },
            { id: 'map', label: t.map, icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
            { id: 'offers', label: t.offers, icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7' },
            { id: 'profile', label: t.profile, icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
            { id: 'admin', label: t.admin, icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as typeof activeTab)}
              className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'text-[#d4af37]'
                  : 'text-[#6b5b4f] hover:text-[#a89984]'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === item.id ? 2 : 1.5} d={item.icon} />
              </svg>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default function DemoPage() {
  return (
    <LanguageProvider>
      <DemoPageContent />
    </LanguageProvider>
  )
}
