export type MembershipStatus = 'inactive' | 'active' | 'suspended'
export type SubscriptionStatus = 'inactive' | 'active' | 'past_due' | 'canceled' | 'free' | 'free_tier'
export type MembershipType = 'standard' | 'model' | 'ambassador' | 'staff' | 'partner'
export type UserRole = 'admin' | 'member'
export type Rank = 'D' | 'C' | 'B' | 'A'
export type QuestType = 'photo' | 'checkin' | 'action'
export type QuestSubmissionStatus = 'pending' | 'approved' | 'rejected'

// 無料メンバータイプかどうかを判定
export const FREE_MEMBERSHIP_TYPES: MembershipType[] = ['model', 'ambassador', 'staff', 'partner']

export function isFreeMembershipType(type: MembershipType): boolean {
  return FREE_MEMBERSHIP_TYPES.includes(type)
}

// メンバータイプのラベル
export const MEMBERSHIP_TYPE_LABELS: Record<MembershipType, string> = {
  standard: 'Standard',
  model: 'Model',
  ambassador: 'Ambassador',
  staff: 'Staff',
  partner: 'Partner',
}

export interface Invite {
  id: string
  code: string
  invited_by: string
  used: boolean
  used_by: string | null
  membership_type: MembershipType
  created_at: string
}

export interface Profile {
  id: string
  display_name: string | null
  role: UserRole
  membership_status: MembershipStatus
  membership_type: MembershipType
  membership_id: string | null
  subscription_status: SubscriptionStatus
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  home_country: string | null
  home_city: string | null
  lat: number | null
  lng: number | null
  instagram_id: string | null
  avatar_url: string | null
  show_location_on_map: boolean
  created_at: string
}

export interface ActivityLog {
  id: string
  user_id: string
  type: string
  points: number
  note: string | null
  created_at: string
}

export interface MasuHub {
  id: string
  name: string
  description: string | null
  country: string
  city: string
  address: string | null
  lat: number
  lng: number
  google_maps_url: string | null
  website_url: string | null
  phone: string | null
  image_url: string | null
  owner_id: string | null
  is_active: boolean
  created_at: string
}

// カスタムロール（カラータグ）
export type RoleColor = 'orange' | 'blue' | 'green' | 'purple' | 'pink' | 'red' | 'yellow' | 'cyan'

export const ROLE_COLOR_OPTIONS: { value: RoleColor; label: string; bg: string; text: string }[] = [
  { value: 'orange', label: 'オレンジ', bg: 'bg-orange-500', text: 'text-orange-500' },
  { value: 'blue', label: 'ブルー', bg: 'bg-blue-500', text: 'text-blue-500' },
  { value: 'green', label: 'グリーン', bg: 'bg-green-500', text: 'text-green-500' },
  { value: 'purple', label: 'パープル', bg: 'bg-purple-500', text: 'text-purple-500' },
  { value: 'pink', label: 'ピンク', bg: 'bg-pink-500', text: 'text-pink-500' },
  { value: 'red', label: 'レッド', bg: 'bg-red-500', text: 'text-red-500' },
  { value: 'yellow', label: 'イエロー', bg: 'bg-yellow-500', text: 'text-yellow-500' },
  { value: 'cyan', label: 'シアン', bg: 'bg-cyan-500', text: 'text-cyan-500' },
]

export interface CustomRole {
  id: string
  name: string
  color: RoleColor
  description: string | null
  created_at: string
}

export interface MemberRole {
  id: string
  member_id: string
  role_id: string
  assigned_at: string
}

export interface GuildOffer {
  id: string
  title: string
  description: string
  offer_type: string
  min_rank: Rank
  provider_id: string
  is_active: boolean
  created_at: string
}

// ギルドクエスト（ミッション）
export interface GuildQuest {
  id: string
  title: string
  description: string
  image_url: string | null
  points_reward: number
  quest_type: QuestType
  is_repeatable: boolean
  is_active: boolean
  created_at: string
}

// クエスト投稿
export interface QuestSubmission {
  id: string
  quest_id: string
  user_id: string
  image_url: string | null
  comment: string | null
  status: QuestSubmissionStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      invites: {
        Row: Invite
        Insert: Omit<Invite, 'id' | 'created_at'>
        Update: Partial<Omit<Invite, 'id'>>
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id'>>
      }
      activity_logs: {
        Row: ActivityLog
        Insert: Omit<ActivityLog, 'id' | 'created_at'>
        Update: Partial<Omit<ActivityLog, 'id'>>
      }
      masu_hubs: {
        Row: MasuHub
        Insert: Omit<MasuHub, 'id' | 'created_at'>
        Update: Partial<Omit<MasuHub, 'id'>>
      }
      guild_offers: {
        Row: GuildOffer
        Insert: Omit<GuildOffer, 'id' | 'created_at'>
        Update: Partial<Omit<GuildOffer, 'id'>>
      }
      custom_roles: {
        Row: CustomRole
        Insert: Omit<CustomRole, 'id' | 'created_at'>
        Update: Partial<Omit<CustomRole, 'id'>>
      }
      member_roles: {
        Row: MemberRole
        Insert: Omit<MemberRole, 'id' | 'assigned_at'>
        Update: Partial<Omit<MemberRole, 'id'>>
      }
      guild_quests: {
        Row: GuildQuest
        Insert: Omit<GuildQuest, 'id' | 'created_at'>
        Update: Partial<Omit<GuildQuest, 'id'>>
      }
      quest_submissions: {
        Row: QuestSubmission
        Insert: Omit<QuestSubmission, 'id' | 'created_at'>
        Update: Partial<Omit<QuestSubmission, 'id'>>
      }
    }
  }
}
