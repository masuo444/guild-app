import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  // 一時的にモックデータを使用（開発中）
  const profile = {
    id: 'dev-user-001',
    email: 'keisukendo414@gmail.com',
    display_name: 'Admin User',
    membership_id: 'FOMUS-001',
    membership_status: 'active',
    subscription_status: 'free',
    membership_type: 'staff',
    rank: 'gold',
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
