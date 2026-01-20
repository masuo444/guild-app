'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type Language = 'ja' | 'en'

const translations = {
  ja: {
    // Header
    membershipCard: 'メンバーシップカード',

    // Card
    guildMember: 'ギルドメンバー',
    memberSince: '加入日',
    points: 'ポイント',
    rank: 'ランク',

    // Navigation
    card: 'カード',
    map: 'マップ',
    offers: '特典',
    profile: 'プロフィール',
    admin: '管理',

    // Recent Activity
    recentActivity: '最近のアクティビティ',
    hubCheckin: 'Hub チェックイン',
    eventAttendance: 'イベント参加',
    welcomeBonus: 'ウェルカムボーナス',

    // Map
    members: 'メンバー',
    hubs: 'Hub',

    // Offers
    guildOffers: 'ギルド特典',
    partnerCafeDiscount: 'パートナーカフェ10%OFF',
    showMemberCard: 'メンバーカードを提示で割引',
    freeCoworkingPass: 'コワーキング1日パス無料',
    validAtAllHubs: '世界中のMASU Hubで利用可能',
    exclusiveEventAccess: '限定イベントアクセス',
    priorityAccess: 'ギルドイベントへの優先アクセス',
    vipLoungeAccess: 'VIPラウンジアクセス',
    premiumFacilities: 'プレミアム施設へのアクセス',

    // Profile
    memberSinceDate: '加入',
    rankProgress: 'ランク進捗',
    pointsToNextRank: '次のランクまで',
    editProfile: 'プロフィール編集',
    manageSubscription: 'サブスクリプション管理',
    signOut: 'サインアウト',

    // Admin
    adminPanel: '管理パネル',
    invites: '招待',
    inviteCodes: '招待コード',
    generate: '生成',
    used: '使用済み',
    available: '利用可能',
  },
  en: {
    // Header
    membershipCard: 'Membership Card',

    // Card
    guildMember: 'Guild Member',
    memberSince: 'Member Since',
    points: 'Points',
    rank: 'Rank',

    // Navigation
    card: 'Card',
    map: 'Map',
    offers: 'Offers',
    profile: 'Profile',
    admin: 'Admin',

    // Recent Activity
    recentActivity: 'Recent Activity',
    hubCheckin: 'Hub Check-in',
    eventAttendance: 'Event Attendance',
    welcomeBonus: 'Welcome Bonus',

    // Map
    members: 'Members',
    hubs: 'Hubs',

    // Offers
    guildOffers: 'Guild Offers',
    partnerCafeDiscount: '10% Off at Partner Cafe',
    showMemberCard: 'Show your member card for discount',
    freeCoworkingPass: 'Free Coworking Day Pass',
    validAtAllHubs: 'Valid at all MASU Hubs worldwide',
    exclusiveEventAccess: 'Exclusive Event Access',
    priorityAccess: 'Priority access to guild events',
    vipLoungeAccess: 'VIP Lounge Access',
    premiumFacilities: 'Access to premium facilities',

    // Profile
    memberSinceDate: 'Member since',
    rankProgress: 'Rank Progress',
    pointsToNextRank: 'points to next rank',
    editProfile: 'Edit Profile',
    manageSubscription: 'Manage Subscription',
    signOut: 'Sign Out',

    // Admin
    adminPanel: 'Admin Panel',
    invites: 'Invites',
    inviteCodes: 'Invite Codes',
    generate: 'Generate',
    used: 'Used',
    available: 'Available',
  },
}

type Translations = typeof translations.en

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('ja')

  const t = translations[language]

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
