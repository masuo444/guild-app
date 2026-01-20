export type MembershipStatus = 'inactive' | 'active' | 'suspended'
export type SubscriptionStatus = 'inactive' | 'active' | 'past_due' | 'canceled' | 'free'
export type MembershipType = 'standard' | 'model' | 'ambassador' | 'staff' | 'partner'
export type UserRole = 'admin' | 'member'
export type Rank = 'D' | 'C' | 'B' | 'A'

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
  lat: number
  lng: number
  owner_id: string | null
  is_active: boolean
  created_at: string
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
    }
  }
}
