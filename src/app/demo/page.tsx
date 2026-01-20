'use client'

import { useState } from 'react'
import { MembershipCard } from '@/components/membership/MembershipCard'
import { Navigation } from '@/components/ui/Navigation'

// デモ用のモックデータ
const mockProfile = {
  id: 'demo-user-id',
  display_name: 'Demo User',
  avatar_url: null,
  country: 'Japan',
  city: 'Tokyo',
  total_points: 450,
  current_rank: 'C' as const,
  member_since: '2024-01-01',
  membership_status: 'active' as const,
  subscription_status: 'active' as const,
  role: 'admin' as const,
}

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<'card' | 'map' | 'offers' | 'profile' | 'admin'>('card')

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-zinc-200 px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-zinc-900">FOMUS GUILD</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
              Rank {mockProfile.current_rank}
            </span>
            <span className="text-xs text-zinc-500">
              {mockProfile.total_points} pts
            </span>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="pb-20">
        {activeTab === 'card' && (
          <div className="p-4">
            <MembershipCard profile={mockProfile} />

            {/* ポイント履歴 */}
            <div className="mt-6 bg-white rounded-xl p-4 shadow-sm">
              <h2 className="font-semibold text-zinc-900 mb-3">Recent Activity</h2>
              <div className="space-y-3">
                {[
                  { action: 'Hub Check-in', points: 50, date: '2024-01-15' },
                  { action: 'Event Attendance', points: 100, date: '2024-01-10' },
                  { action: 'Welcome Bonus', points: 100, date: '2024-01-01' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-zinc-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{item.action}</p>
                      <p className="text-xs text-zinc-500">{item.date}</p>
                    </div>
                    <span className="text-sm font-semibold text-green-600">+{item.points}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="p-4">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="h-[60vh] bg-zinc-200 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 text-zinc-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <p className="text-zinc-500">Global Member Map</p>
                  <p className="text-xs text-zinc-400 mt-1">Google Maps API Required</p>
                </div>
              </div>
            </div>

            {/* 統計 */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <p className="text-2xl font-bold text-zinc-900">127</p>
                <p className="text-xs text-zinc-500">Members</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <p className="text-2xl font-bold text-zinc-900">8</p>
                <p className="text-xs text-zinc-500">Hubs</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="p-4 space-y-4">
            <h2 className="font-semibold text-zinc-900">Guild Offers</h2>

            {[
              { title: '10% Off at Partner Cafe', minRank: 'D', description: 'Show your member card for discount' },
              { title: 'Free Coworking Day Pass', minRank: 'C', description: 'Valid at all MASU Hubs worldwide' },
              { title: 'Exclusive Event Access', minRank: 'B', description: 'Priority access to guild events' },
              { title: 'VIP Lounge Access', minRank: 'A', description: 'Access to premium facilities' },
            ].map((offer, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-zinc-900">{offer.title}</h3>
                    <p className="text-sm text-zinc-500 mt-1">{offer.description}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    offer.minRank <= mockProfile.current_rank
                      ? 'bg-green-100 text-green-800'
                      : 'bg-zinc-100 text-zinc-500'
                  }`}>
                    Rank {offer.minRank}+
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="p-4 space-y-4">
            {/* プロフィールヘッダー */}
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="w-20 h-20 bg-zinc-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">D</span>
              </div>
              <h2 className="font-semibold text-zinc-900">{mockProfile.display_name}</h2>
              <p className="text-sm text-zinc-500">{mockProfile.city}, {mockProfile.country}</p>
              <p className="text-xs text-zinc-400 mt-2">Member since {mockProfile.member_since}</p>
            </div>

            {/* ランク進捗 */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-medium text-zinc-900 mb-3">Rank Progress</h3>
              <div className="flex justify-between text-xs text-zinc-500 mb-2">
                <span>Rank C</span>
                <span>Rank B (300 pts)</span>
              </div>
              <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '75%' }} />
              </div>
              <p className="text-xs text-zinc-500 mt-2 text-center">150 points to next rank</p>
            </div>

            {/* アクション */}
            <div className="space-y-2">
              <button className="w-full bg-white rounded-xl p-4 shadow-sm text-left flex justify-between items-center">
                <span className="text-zinc-900">Edit Profile</span>
                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button className="w-full bg-white rounded-xl p-4 shadow-sm text-left flex justify-between items-center">
                <span className="text-zinc-900">Manage Subscription</span>
                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button className="w-full bg-red-50 rounded-xl p-4 shadow-sm text-left">
                <span className="text-red-600">Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="p-4 space-y-4">
            <h2 className="font-semibold text-zinc-900">Admin Panel</h2>

            {/* タブ */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['Invites', 'Members', 'Hubs', 'Offers'].map((tab) => (
                <button
                  key={tab}
                  className="px-4 py-2 bg-white rounded-lg text-sm font-medium text-zinc-700 whitespace-nowrap shadow-sm"
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* 招待コード管理 */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-zinc-900">Invite Codes</h3>
                <button className="text-sm bg-zinc-900 text-white px-3 py-1.5 rounded-lg">
                  Generate
                </button>
              </div>
              <div className="space-y-2">
                {[
                  { code: 'FOMUS2026', used: false },
                  { code: 'GUILD-ABC', used: true },
                  { code: 'MEMBER-XYZ', used: true },
                ].map((invite, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-zinc-50 rounded-lg">
                    <code className="text-sm font-mono">{invite.code}</code>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      invite.used ? 'bg-zinc-200 text-zinc-600' : 'bg-green-100 text-green-800'
                    }`}>
                      {invite.used ? 'Used' : 'Available'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 px-2 py-2 safe-area-bottom">
        <div className="flex justify-around">
          {[
            { id: 'card', label: 'Card', icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2' },
            { id: 'map', label: 'Map', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
            { id: 'offers', label: 'Offers', icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7' },
            { id: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
            { id: 'admin', label: 'Admin', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as typeof activeTab)}
              className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
                activeTab === item.id ? 'text-zinc-900' : 'text-zinc-400'
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
