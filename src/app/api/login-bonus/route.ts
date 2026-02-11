import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceClient = createServiceClient()
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  // 今日のLogin Bonusが既にあるかチェック
  const { data: todayBonus } = await serviceClient
    .from('activity_logs')
    .select('id')
    .eq('user_id', user.id)
    .eq('type', 'Login Bonus')
    .eq('note', today)
    .limit(1)

  if (todayBonus && todayBonus.length > 0) {
    return NextResponse.json({
      dailyBonus: false,
      streakBonus: null,
      streakDays: 0,
      message: 'Already claimed today',
    })
  }

  // 日次ログインボーナス 10pt を挿入
  await serviceClient.from('activity_logs').insert({
    user_id: user.id,
    type: 'Login Bonus',
    points: 10,
    note: today,
  })

  // 連続日数を計算
  const { data: loginLogs } = await serviceClient
    .from('activity_logs')
    .select('note')
    .eq('user_id', user.id)
    .eq('type', 'Login Bonus')
    .order('created_at', { ascending: false })

  let streakDays = 0
  let streakBonus: number | null = null

  if (loginLogs && loginLogs.length > 0) {
    const dates = [...new Set(loginLogs.map((log) => log.note).filter(Boolean))] as string[]
    dates.sort((a, b) => b.localeCompare(a))

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
        streakBonus = 7
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
        streakBonus = 30
      }
    }
  }

  return NextResponse.json({
    dailyBonus: true,
    streakBonus,
    streakDays,
  })
}
