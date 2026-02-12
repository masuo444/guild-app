import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { DashboardClient } from './DashboardClient'
import { Profile } from '@/types/database'

export interface LoginBonusResult {
  dailyBonus: boolean
  streakBonus: number | null // 7 or 30 if streak bonus was awarded
  streakDays: number
}

export default async function DashboardPage() {
  // Supabaseから実データを取得
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 未ログインの場合はログインページへリダイレクト
  if (!user) {
    redirect('/auth/login')
  }

  // プロフィール取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // ── ログインボーナス処理 ──
  const serviceClient = createServiceClient()
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  let loginBonusResult: LoginBonusResult = {
    dailyBonus: false,
    streakBonus: null,
    streakDays: 0,
  }

  // 今日のLogin Bonusが既にあるかチェック（note に YYYY-MM-DD を記録して重複防止）
  const { data: todayBonus } = await serviceClient
    .from('activity_logs')
    .select('id')
    .eq('user_id', user.id)
    .eq('type', 'Login Bonus')
    .eq('note', today)
    .limit(1)

  if (!todayBonus || todayBonus.length === 0) {
    // 日次ログインボーナス 10pt を挿入
    await serviceClient.from('activity_logs').insert({
      user_id: user.id,
      type: 'Login Bonus',
      points: 10,
      note: today,
    })
    loginBonusResult.dailyBonus = true

    // 連続日数を計算
    const { data: loginLogs } = await serviceClient
      .from('activity_logs')
      .select('note')
      .eq('user_id', user.id)
      .eq('type', 'Login Bonus')
      .order('created_at', { ascending: false })

    if (loginLogs && loginLogs.length > 0) {
      // note（YYYY-MM-DD）でユニークな日付を取得し、今日から連続する日数をカウント
      const dates = [...new Set(loginLogs.map((log) => log.note).filter(Boolean))] as string[]
      dates.sort((a, b) => b.localeCompare(a)) // 降順

      let streakDays = 0
      const currentDate = new Date(today + 'T00:00:00')

      for (const dateStr of dates) {
        const expectedDate = new Date(currentDate)
        expectedDate.setDate(expectedDate.getDate() - streakDays)
        const expected = expectedDate.toISOString().split('T')[0]

        if (dateStr === expected) {
          streakDays++
        } else {
          break
        }
      }

      loginBonusResult.streakDays = streakDays

      // 7日連続ボーナス
      if (streakDays === 7 || (streakDays > 7 && streakDays % 7 === 0)) {
        const streakNote = `7-day:${today}`
        const { data: existing7 } = await serviceClient
          .from('activity_logs')
          .select('id')
          .eq('user_id', user.id)
          .eq('type', 'Login Streak Bonus')
          .eq('note', streakNote)
          .limit(1)

        if (!existing7 || existing7.length === 0) {
          await serviceClient.from('activity_logs').insert({
            user_id: user.id,
            type: 'Login Streak Bonus',
            points: 50,
            note: streakNote,
          })
          loginBonusResult.streakBonus = 7
        }
      }

      // 30日連続ボーナス
      if (streakDays === 30 || (streakDays > 30 && streakDays % 30 === 0)) {
        const streakNote = `30-day:${today}`
        const { data: existing30 } = await serviceClient
          .from('activity_logs')
          .select('id')
          .eq('user_id', user.id)
          .eq('type', 'Login Streak Bonus')
          .eq('note', streakNote)
          .limit(1)

        if (!existing30 || existing30.length === 0) {
          await serviceClient.from('activity_logs').insert({
            user_id: user.id,
            type: 'Login Streak Bonus',
            points: 150,
            note: streakNote,
          })
          loginBonusResult.streakBonus = 30
        }
      }
    }
  }

  // アクティビティログ取得（ログインボーナス挿入後に取得）
  const { data: logs } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // ポイント集計
  const totalPoints = logs?.reduce((sum, log) => sum + (log.points || 0), 0) ?? 0

  // 招待した人数を取得
  const { count: inviteCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('invited_by', user.id)

  // プロフィールがない場合のフォールバック
  const userProfile: Profile = profile || {
    id: user.id,
    display_name: user.email?.split('@')[0] || 'User',
    role: 'user',
    membership_status: 'pending',
    membership_type: 'free',
    membership_id: null,
    subscription_status: 'free_tier',
    stripe_customer_id: null,
    stripe_subscription_id: null,
    home_country: null,
    home_city: null,
    lat: null,
    lng: null,
    instagram_id: null,
    avatar_url: null,
    show_location_on_map: true,
    created_at: new Date().toISOString(),
  }

  return (
    <DashboardClient
      profile={userProfile}
      totalPoints={totalPoints}
      recentLogs={logs || []}
      inviteCount={inviteCount || 0}
      loginBonusResult={loginBonusResult}
    />
  )
}
