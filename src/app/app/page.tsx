import { DashboardClient } from './DashboardClient'
import { Profile } from '@/types/database'

export default async function DashboardPage() {
  // 一時的にモックデータを使用（開発中）
  const profile: Profile = {
    id: 'dev-user-001',
    display_name: 'Admin User',
    role: 'admin',
    membership_status: 'active',
    membership_type: 'staff',
    membership_id: 'FOMUS-001',
    subscription_status: 'free',
    stripe_customer_id: null,
    stripe_subscription_id: null,
    home_country: 'Japan',
    home_city: 'Tokyo',
    lat: 35.6762,
    lng: 139.6503,
    created_at: new Date().toISOString(),
  }

  const totalPoints = 1250
  const recentLogs: never[] = []

  return (
    <DashboardClient
      profile={profile}
      totalPoints={totalPoints}
      recentLogs={recentLogs}
    />
  )
}
