'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Language = 'ja' | 'en'

const LANGUAGE_KEY = 'fomus-guild-language'

const translations = {
  ja: {
    // Landing Page
    landingTitle: 'グローバル枡コミュニティに参加しよう',
    landingSubtitle: 'FOMUS GUILDは、世界中の枡愛好家をつなぐ招待制コミュニティです',
    joinGuild: 'ギルドに参加',
    login: 'ログイン',
    viewDemo: 'デモを見る',
    features: '特徴',
    feature1Title: 'デジタル会員証',
    feature1Desc: 'ユニークなデジタル会員証で特典を受けられます',
    feature2Title: 'グローバルネットワーク',
    feature2Desc: '世界中の枡愛好家とつながりましょう',
    feature3Title: '限定特典',
    feature3Desc: 'メンバー限定の割引やイベントにアクセス',
    howToJoin: '参加方法',
    step1: '既存メンバーから招待コードを受け取る',
    step2: 'メールアドレスを登録',
    step3: 'メンバーシップを開始',
    invitationOnly: '招待制コミュニティ',
    invitationOnlyDesc: 'FOMUS GUILDは招待制です。既存メンバーから招待コードを受け取ってください。',
    haveInviteCode: '招待コードをお持ちですか？',
    enterInviteCode: '招待コードを入力',
    alreadyMember: '既存メンバーの方',

    // Invite Page
    welcomeToGuild: 'FOMUS GUILDへようこそ',
    youveBeenInvited: '限定コミュニティへ招待されました',
    enterEmail: 'メールアドレスを入力',
    continueWithEmail: 'メールで続ける',
    freeInvitation: '招待（無料）',
    afterVerification: 'メール確認後、$10/月のサブスクリプションでメンバーシップを開始できます',
    freeAccess: '無料でFOMUS GUILDにアクセスできます。支払いは不要です。',
    checkYourEmail: 'メールを確認してください',
    magicLinkSent: 'にマジックリンクを送信しました',
    clickLinkToRegister: 'メールのリンクをクリックして登録を完了してください',
    invalidInvitation: '無効な招待コード',
    invalidInvitationDesc: 'この招待コードは有効ではありません。招待者にお問い合わせください。',
    invitationUsed: '使用済みの招待コード',
    invitationUsedDesc: 'この招待コードは既に使用されています。既に登録済みの場合はログインしてください。',
    goToLogin: 'ログインへ',
    returnHome: 'ホームに戻る',
    proceedToPayment: '決済に進む',
    verifyingPayment: '決済を確認中...',
    sendingEmail: 'メールを送信中...',
    paymentComplete: '決済完了！',
    errorOccurred: 'エラーが発生しました',
    invalidSession: '無効なセッションです',

    // Login Page
    loginTitle: 'FOMUS GUILD',
    loginSubtitle: 'グローバル枡コミュニティに参加',
    newRegistration: '新規登録',
    existingMemberLogin: '既存メンバーログイン',
    enterRegisteredEmail: '登録済みのメールアドレスを入力してください',
    emailAddress: 'メールアドレス',
    sendLoginLink: 'ログイン',
    sending: '送信中...',
    loginLinkSent: 'ログインリンクをメールで送信しました。メールをご確認ください。',
    inviteCode: '招待コード',
    inviteCodePlaceholder: '例: ABC12345',
    noInviteCode: '招待コードがない場合は、既存メンバーから招待を受けてください',
    next: '次へ',
    checking: '確認中...',
    invalidCode: 'この招待コードは無効です',
    codeAlreadyUsed: 'この招待コードは既に使用されています',
    inviteConfirmed: '招待コード確認完了',
    freeInvite: '（無料招待）',
    sendRegisterLink: '登録リンクを送信',
    changeInviteCode: '← 招待コードを変更',
    freeJoinGuild: '無料でFOMUS GUILDに参加できます',
    paidJoinGuild: 'メール確認後、$10/月のサブスクリプションで参加できます',
    checkEmailForRegister: 'メールを確認してください',
    registerLinkSent: 'に登録リンクを送信しました',
    clickLinkToComplete: 'メールのリンクをクリックして登録を完了してください',
    backToHome: '← ホームに戻る',

    // Subscribe Page
    membershipTitle: 'FOMUS GUILD メンバーシップ',
    membershipDesc: 'ギルドメンバーとして全機能にアクセスできます',
    redirectingToPayment: '決済ページへ移動中...',
    paymentCanceled: '決済がキャンセルされました。もう一度お試しください。',
    benefit1: 'デジタル会員証',
    benefit2: 'ギルドマップでメンバーを閲覧',
    benefit3: 'クエストに参加してポイント獲得',
    benefit4: 'メンバー限定特典・オファー',
    subscribeJapan: '¥980/月 で登録',
    subscribeIntl: '$10/month で登録',
    cancelAnytime: 'いつでもキャンセル可能です。決済はStripeで安全に処理されます。',
    logout: 'ログアウト',

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
    masuHubs: 'MASU Hubs',
    searchPlaceholder: '名前、都市、国で検索...',
    allCountries: 'すべての国',
    clearFilters: 'フィルターをクリア',
    showing: '表示中',
    clickMapToSelect: 'マップをクリックして場所を選択',
    cancel: 'キャンセル',
    shopName: '店舗名',
    description: '説明',
    country: '国',
    city: '都市',
    location: '場所',
    change: '変更',
    addShop: '店舗を追加',
    saving: '保存中...',
    openInGoogleMaps: 'Google Mapsで開く',
    website: 'ウェブサイト',

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
    inviteFriends: '友達を招待',
    inviteFriendsDesc: '招待コードを発行して友達をFOMUS GUILDに招待できます。招待された方は月額会員として参加できます。',
    generateInviteCode: '招待コードを発行',
    inviteCodeCreated: '招待コードを作成しました！',
    inviteUrlCopied: '招待URLをクリップボードにコピーしました',
    showGeneratedCodes: '発行済みコードを表示',
    generatedCodes: '発行済みコード',
    unused: '未使用',
    used: '使用済み',
    copyUrl: 'URLをコピー',
    copied: 'コピー済み!',
    noCodesYet: 'まだ招待コードを発行していません',

    // Admin
    adminPanel: '管理パネル',
    invites: '招待',
    inviteCodes: '招待コード',
    generate: '生成',
    available: '利用可能',
  },
  en: {
    // Landing Page
    landingTitle: 'Join the Global MASU Community',
    landingSubtitle: 'FOMUS GUILD is an invitation-only community connecting MASU enthusiasts worldwide',
    joinGuild: 'Join Guild',
    login: 'Login',
    viewDemo: 'View Demo',
    features: 'Features',
    feature1Title: 'Digital Membership Card',
    feature1Desc: 'Get exclusive benefits with your unique digital membership card',
    feature2Title: 'Global Network',
    feature2Desc: 'Connect with MASU enthusiasts around the world',
    feature3Title: 'Exclusive Benefits',
    feature3Desc: 'Access member-only discounts and events',
    howToJoin: 'How to Join',
    step1: 'Receive an invite code from an existing member',
    step2: 'Register with your email',
    step3: 'Start your membership',
    invitationOnly: 'Invitation Only Community',
    invitationOnlyDesc: 'FOMUS GUILD is invitation-only. Please get an invite code from an existing member.',
    haveInviteCode: 'Have an invite code?',
    enterInviteCode: 'Enter invite code',
    alreadyMember: 'Already a member?',

    // Invite Page
    welcomeToGuild: 'Welcome to FOMUS GUILD',
    youveBeenInvited: "You've been invited to join an exclusive community",
    enterEmail: 'Enter your email',
    continueWithEmail: 'Continue with Email',
    freeInvitation: 'Invitation (Free)',
    afterVerification: "After verification, you'll be asked to complete a $10/month subscription",
    freeAccess: "You'll get free access to FOMUS GUILD. No payment required.",
    checkYourEmail: 'Check Your Email',
    magicLinkSent: "We've sent a magic link to",
    clickLinkToRegister: 'Click the link in the email to continue your registration',
    invalidInvitation: 'Invalid Invitation',
    invalidInvitationDesc: 'This invitation code is not valid. Please contact the person who invited you.',
    invitationUsed: 'Invitation Used',
    invitationUsedDesc: "This invitation has already been used. If you've already registered, please log in.",
    goToLogin: 'Go to Login',
    returnHome: 'Return Home',
    proceedToPayment: 'Proceed to Payment',
    verifyingPayment: 'Verifying payment...',
    sendingEmail: 'Sending email...',
    paymentComplete: 'Payment Complete!',
    errorOccurred: 'An Error Occurred',
    invalidSession: 'Invalid session',

    // Login Page
    loginTitle: 'FOMUS GUILD',
    loginSubtitle: 'Join the global MASU community',
    newRegistration: 'New Registration',
    existingMemberLogin: 'Existing Member Login',
    enterRegisteredEmail: 'Enter your registered email address',
    emailAddress: 'Email Address',
    sendLoginLink: 'Login',
    sending: 'Sending...',
    loginLinkSent: "We've sent a login link to your email. Please check your inbox.",
    inviteCode: 'Invite Code',
    inviteCodePlaceholder: 'e.g., ABC12345',
    noInviteCode: "If you don't have an invite code, please get one from an existing member",
    next: 'Next',
    checking: 'Checking...',
    invalidCode: 'This invite code is invalid',
    codeAlreadyUsed: 'This invite code has already been used',
    inviteConfirmed: 'Invite Code Confirmed',
    freeInvite: '(Free Invite)',
    sendRegisterLink: 'Send Registration Link',
    changeInviteCode: '← Change invite code',
    freeJoinGuild: 'Join FOMUS GUILD for free',
    paidJoinGuild: 'After email verification, join with $10/month subscription',
    checkEmailForRegister: 'Check Your Email',
    registerLinkSent: "We've sent a registration link to",
    clickLinkToComplete: 'Click the link in the email to complete registration',
    backToHome: '← Back to Home',

    // Subscribe Page
    membershipTitle: 'FOMUS GUILD Membership',
    membershipDesc: 'Get full access as a guild member',
    redirectingToPayment: 'Redirecting to payment...',
    paymentCanceled: 'Payment was canceled. Please try again.',
    benefit1: 'Digital Membership Card',
    benefit2: 'View members on Guild Map',
    benefit3: 'Join quests and earn points',
    benefit4: 'Member-only benefits & offers',
    subscribeJapan: 'Subscribe for ¥980/month',
    subscribeIntl: 'Subscribe for $10/month',
    cancelAnytime: 'Cancel anytime. Payments are securely processed by Stripe.',
    logout: 'Logout',

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
    masuHubs: 'MASU Hubs',
    searchPlaceholder: 'Search by name, city, country...',
    allCountries: 'All Countries',
    clearFilters: 'Clear filters',
    showing: 'Showing',
    clickMapToSelect: 'Click on the map to select location',
    cancel: 'Cancel',
    shopName: 'Shop Name',
    description: 'Description',
    country: 'Country',
    city: 'City',
    location: 'Location',
    change: 'Change',
    addShop: 'Add Shop',
    saving: 'Saving...',
    openInGoogleMaps: 'Open in Google Maps',
    website: 'Website',

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
    inviteFriends: 'Invite Friends',
    inviteFriendsDesc: 'Generate invite codes to invite friends to FOMUS GUILD. They will join as monthly subscribers.',
    generateInviteCode: 'Generate Invite Code',
    inviteCodeCreated: 'Invite code created!',
    inviteUrlCopied: 'Invite URL copied to clipboard',
    showGeneratedCodes: 'Show generated codes',
    generatedCodes: 'Generated codes',
    unused: 'Unused',
    used: 'Used',
    copyUrl: 'Copy URL',
    copied: 'Copied!',
    noCodesYet: "You haven't generated any invite codes yet",

    // Admin
    adminPanel: 'Admin Panel',
    invites: 'Invites',
    inviteCodes: 'Invite Codes',
    generate: 'Generate',
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

// Get saved language or detect from browser
export function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'en'

  const saved = localStorage.getItem(LANGUAGE_KEY) as Language | null
  if (saved && (saved === 'ja' || saved === 'en')) {
    return saved
  }

  // Auto-detect from browser
  const browserLang = navigator.language || ''
  if (browserLang.startsWith('ja')) {
    return 'ja'
  }

  return 'en'
}

// Get translations without context (for pages without provider)
export function getTranslations(lang: Language): Translations {
  return translations[lang]
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [isLoaded, setIsLoaded] = useState(false)

  // Load language from localStorage on mount
  useEffect(() => {
    const lang = getInitialLanguage()
    setLanguageState(lang)
    setIsLoaded(true)
  }, [])

  // Save language to localStorage when changed
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(LANGUAGE_KEY, lang)
  }

  const t = translations[language]

  // Prevent flash of wrong language
  if (!isLoaded) {
    return null
  }

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
