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

    // Dashboard
    dashboard: 'ダッシュボード',
    masuPoints: 'MASU ポイント',
    noActivity: 'まだアクティビティがありません',
    maxRank: '最高ランク',
    notSet: '未設定',
    ptsToNext: '次まで',

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

    // OTP / Verification
    enterVerificationCode: '認証コードを入力',
    verificationCode: '認証コード',
    codeSentTo: 'に送信されたコードを入力してください',
    verifyAndLogin: 'ログイン',
    verifyAndRegister: '認証して登録',
    register: '登録する',
    sendVerificationCode: '認証コードを送信',
    changeEmail: 'メールアドレスを変更する',
    invalidCodeRetry: 'コードが正しくありません。もう一度お試しください。',
    invalidCodeError: 'コードが正しくありません',
    loggingIn: 'ログイン処理中...',
    codeSentSuccess: '認証コードをメールに送信しました。',
    serverError: 'サーバーエラーが発生しました。しばらく待ってから再度お試しください。',

    // Map Page
    guildMap: 'ギルドマップ',
    exploreMembers: 'メンバーとMASU Hubを世界中で探索',
    exploreHubs: 'MASU Hubを世界中で探索',
    demoMode: 'デモモード',
    demoModeDesc: 'MASU Hubsの場所をプレビューできます。メンバーの場所を見るにはギルドに参加してください。',
    upgradeSeeMembers: 'アップグレードしてメンバーの場所を表示',
    upgradeSeeMembersDesc: '無料メンバーはMASU Hubの場所のみ閲覧できます。アップグレードして全メンバーを表示しましょう。',
    upgrade: 'アップグレード',
    fullscreen: '全画面',
    viewFullscreen: '全画面で表示',
    search: '検索...',
    clear: 'クリア',
    showingResults: '表示中',
    membersCount: 'メンバー',
    hubsCount: 'Hub',

    // Guild Member Only
    guildMemberOnly: 'ギルドメンバー限定',
    guildMemberOnlyDesc: 'この機能はギルドメンバー限定です。ギルドに参加して全機能をご利用ください。',

    // Demo Dashboard
    fomusGuildPreview: 'FOMUS GUILD プレビュー',
    demoModeMapOnly: 'デモモードではマップ機能のみご利用いただけます。',
    viewMasuHubLocations: 'MASU Hubsの場所を確認できます',
    joinFomusGuild: 'FOMUS GUILDに参加しよう',
    joinFomusGuildDesc: '全機能にアクセスして、MASU Pointsを獲得しよう。',
    getStarted: 'はじめる',
    offersAndQuests: '特典 & クエスト',
    viewDigitalCard: 'デジタル会員証とランクを確認',
    trackPointsProgress: 'ポイントとランクの進捗を確認',
    accessExclusiveOffers: 'メンバー限定の特典とクエストにアクセス',
    manageProfileSettings: 'プロフィールと設定を管理',
    tapToFlip: 'タップで裏面を見る',

    // Offers Page
    offersTitle: '特典',
    memberOffersAndQuests: 'メンバー限定の特典とクエスト',
    upgradeForOffers: '特典へのアクセスにはアップグレードが必要です',
    upgradeForOffersDesc: 'サービス特典とクエストは有料メンバー限定です。メンバーシップをアップグレードして、割引や特別チャレンジなどの特典をご利用ください。',
    fomusServices: 'FOMUSのサービス',
    quests: 'クエスト',
    noQuestsAvailable: '現在利用可能なクエストはありません',
    stayTuned: '新しいチャレンジをお楽しみに！',
    masuPhotoDesc: '世界中で『枡を持って撮る』アートプロジェクト。【※15ヶ国・2025年12月現在】枡が人と文化をつなぐ表現を可能に。',
    fomusParureDesc: '世界最小サイズの枡を活用したジュエリーブランド。',
    masukameDesc: '枡（益＝繁栄）と亀（長寿）を一体化した世界で唯一のアート作品。',
    kukuDesc: '精霊と木の神をめぐる物語。絵本・小説・アニメ・グッズへと展開する長編物語。鋭意制作中。',
    silvaDesc: '世界初、枡を使って遊べるカードゲーム。子どもからご年配の方まで遊べます。',

    // Profile Page
    profileSettings: 'プロフィール設定',
    personalInfo: '個人情報',
    displayName: '表示名',
    profileImage: 'プロフィール画像',
    profileImageDesc: '正方形にクロップされ、マップ上のアイコンとして表示されます（最大500MB、自動圧縮）',
    selectImage: '画像を選択',
    compressing: '圧縮中...',
    removeImage: '削除',
    locationInputNote: '日本語または英語で入力できます（例: 日本 / Japan, 東京都 / Tokyo）',
    countryLabel: '国 / Country',
    stateLabel: '県 / State',
    cityLabel: '市 / City',
    pinLocation: 'ピンの位置',
    geocodingLabel: '取得中...',
    reGeocode: '住所から再取得',
    adjustPinDesc: 'マップをタップ/ピンチでズームしてピンの位置を調整',
    setPinDesc: '住所から位置を取得中...マップをタップしてピンを設置',
    showLocationOnMap: 'マップに位置を表示',
    showLocationDesc: '他のメンバーがギルドマップであなたの位置を確認できます',
    saveChanges: '変更を保存',
    membership: 'メンバーシップ',
    membershipIdLabel: 'メンバーシップID',
    statusLabel: 'ステータス',
    active: 'アクティブ',
    inactive: '非アクティブ',
    email: 'メール',
    viewProfileLink: 'プロフィールを見る →',
    fileTooLarge: 'ファイルサイズが大きすぎます',
    selectImageFile: '画像ファイルを選択してください',
    imageUploaded: '画像をアップロードしました',
    imageUploadFailed: '画像のアップロードに失敗しました',
    profileUpdated: 'プロフィールを更新しました',

    // UpgradeBanner
    upgradeToUnlock: 'アップグレードして解除',
    upgradeFeatureDesc: 'この機能は有料メンバー限定です。メンバーシップをアップグレードして全機能にアクセスしましょう。',
    upgradeNow: '今すぐアップグレード',
    freeViewHubs: '無料メンバーはMASU Hubの場所をマップで閲覧できます',

    // Super Admin
    superAdmin: 'スーパー',
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

    // Dashboard
    dashboard: 'Dashboard',
    masuPoints: 'MASU Points',
    noActivity: 'No activity yet',
    maxRank: 'Max Rank',
    notSet: 'Not set',
    ptsToNext: 'pts to next',

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

    // OTP / Verification
    enterVerificationCode: 'Enter Verification Code',
    verificationCode: 'Verification Code',
    codeSentTo: 'Enter the code sent to your email',
    verifyAndLogin: 'Verify & Login',
    verifyAndRegister: 'Verify & Register',
    register: 'Register',
    sendVerificationCode: 'Send Verification Code',
    changeEmail: 'Change email address',
    invalidCodeRetry: 'Invalid code. Please try again.',
    invalidCodeError: 'Invalid code',
    loggingIn: 'Logging in...',
    codeSentSuccess: 'Verification code sent to your email.',
    serverError: 'A server error occurred. Please try again later.',

    // Map Page
    guildMap: 'Guild Map',
    exploreMembers: 'Explore members and MASU Hubs around the world',
    exploreHubs: 'Explore MASU Hubs around the world',
    demoMode: 'Demo Mode',
    demoModeDesc: 'Preview MASU Hub locations. Join the guild to see member locations.',
    upgradeSeeMembers: 'Upgrade to see member locations',
    upgradeSeeMembersDesc: 'Free members can only view MASU Hub locations. Upgrade to see all guild members on the map.',
    upgrade: 'Upgrade',
    fullscreen: 'Fullscreen',
    viewFullscreen: 'View fullscreen',
    search: 'Search...',
    clear: 'Clear',
    showingResults: 'Showing',
    membersCount: 'Members',
    hubsCount: 'Hubs',

    // Guild Member Only
    guildMemberOnly: 'Guild Member Only',
    guildMemberOnlyDesc: 'This feature is for guild members only. Join the guild to access all features.',

    // Demo Dashboard
    fomusGuildPreview: 'FOMUS GUILD Preview',
    demoModeMapOnly: 'In demo mode, only the map feature is available.',
    viewMasuHubLocations: 'View MASU Hub locations',
    joinFomusGuild: 'Join FOMUS GUILD',
    joinFomusGuildDesc: 'Access all features and earn MASU Points.',
    getStarted: 'Get Started',
    offersAndQuests: 'Offers & Quests',
    viewDigitalCard: 'View your digital membership card and rank',
    trackPointsProgress: 'Track your points and rank progress',
    accessExclusiveOffers: 'Access exclusive offers and complete quests for rewards',
    manageProfileSettings: 'Manage your profile and settings',
    tapToFlip: 'Tap to flip',

    // Offers Page
    offersTitle: 'Offers',
    memberOffersAndQuests: 'Member-only benefits and quests',
    upgradeForOffers: 'Upgrade required to access offers',
    upgradeForOffersDesc: 'Service offers and quests are for paid members only. Upgrade your membership to access discounts, special challenges, and more.',
    fomusServices: 'FOMUS Services',
    quests: 'Quests',
    noQuestsAvailable: 'No quests currently available',
    stayTuned: 'Stay tuned for new challenges!',
    masuPhotoDesc: 'A global art project of photographing with MASU. Currently in 15 countries as of Dec 2025. MASU enables expression connecting people and cultures.',
    fomusParureDesc: "A jewelry brand utilizing the world's smallest MASU.",
    masukameDesc: "The world's only art piece combining MASU (prosperity) and turtle (longevity).",
    kukuDesc: 'A story about spirits and tree gods. An epic tale expanding into picture books, novels, anime, and merchandise. Currently in production.',
    silvaDesc: "The world's first card game you can play with MASU. Enjoyable for children to seniors.",

    // Profile Page
    profileSettings: 'Profile Settings',
    personalInfo: 'Personal Information',
    displayName: 'Display Name',
    profileImage: 'Profile Image',
    profileImageDesc: 'Will be cropped to a square and displayed as your icon on the map (max 500MB, auto-compressed)',
    selectImage: 'Select Image',
    compressing: 'Compressing...',
    removeImage: 'Remove',
    locationInputNote: 'You can enter in Japanese or English (e.g., Japan, Tokyo)',
    countryLabel: 'Country',
    stateLabel: 'State',
    cityLabel: 'City',
    pinLocation: 'Pin Location',
    geocodingLabel: 'Locating...',
    reGeocode: 'Re-geocode from address',
    adjustPinDesc: 'Tap/pinch to zoom and adjust pin location on the map',
    setPinDesc: 'Locating from address... Tap map to set pin',
    showLocationOnMap: 'Show location on map',
    showLocationDesc: 'Allow other members to see your location on the Guild Map',
    saveChanges: 'Save Changes',
    membership: 'Membership',
    membershipIdLabel: 'Membership ID',
    statusLabel: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    email: 'Email',
    viewProfileLink: 'View profile →',
    fileTooLarge: 'File size is too large',
    selectImageFile: 'Please select an image file',
    imageUploaded: 'Image uploaded',
    imageUploadFailed: 'Failed to upload image',
    profileUpdated: 'Profile updated successfully',

    // UpgradeBanner
    upgradeToUnlock: 'Upgrade to Unlock',
    upgradeFeatureDesc: 'This feature is available for paid members. Upgrade your membership to access all features.',
    upgradeNow: 'Upgrade Now',
    freeViewHubs: 'Free members can view MASU Hub locations on the map',

    // Super Admin
    superAdmin: 'Super',
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
