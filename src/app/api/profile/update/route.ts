import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function checkAutoQuests(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  profileData: {
    display_name?: string
    home_country?: string
    home_city?: string
    avatar_url?: string
    show_location_on_map?: boolean
    lat?: number
    lng?: number
  }
): Promise<{ type: 'profile' | 'map'; points: number }[]> {
  const completed: { type: 'profile' | 'map'; points: number }[] = []

  // Check "プロフィールを完成させよう" quest
  const profileComplete =
    profileData.display_name &&
    profileData.home_country &&
    profileData.home_city &&
    profileData.avatar_url

  if (profileComplete) {
    const { data: profileQuest } = await supabase
      .from('guild_quests')
      .select('id, points_reward')
      .eq('is_auto', true)
      .eq('title', 'プロフィールを完成させよう')
      .eq('is_active', true)
      .single()

    if (profileQuest) {
      const { data: existing } = await supabase
        .from('quest_submissions')
        .select('id')
        .eq('quest_id', profileQuest.id)
        .eq('user_id', userId)
        .single()

      if (!existing) {
        await supabase.from('quest_submissions').insert({
          quest_id: profileQuest.id,
          user_id: userId,
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          comment: 'auto',
        })

        await supabase.from('activity_logs').insert({
          user_id: userId,
          type: 'Quest Reward',
          note: `Quest: ${profileQuest.id}`,
          points: profileQuest.points_reward,
        })

        completed.push({ type: 'profile', points: profileQuest.points_reward })
      }
    }
  }

  // Check "マップに自分を表示しよう" quest
  const mapVisible =
    profileData.show_location_on_map &&
    profileData.lat != null &&
    profileData.lng != null

  if (mapVisible) {
    const { data: mapQuest } = await supabase
      .from('guild_quests')
      .select('id, points_reward')
      .eq('is_auto', true)
      .eq('title', 'マップに自分を表示しよう')
      .eq('is_active', true)
      .single()

    if (mapQuest) {
      const { data: existing } = await supabase
        .from('quest_submissions')
        .select('id')
        .eq('quest_id', mapQuest.id)
        .eq('user_id', userId)
        .single()

      if (!existing) {
        await supabase.from('quest_submissions').insert({
          quest_id: mapQuest.id,
          user_id: userId,
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          comment: 'auto',
        })

        await supabase.from('activity_logs').insert({
          user_id: userId,
          type: 'Quest Reward',
          note: `Quest: ${mapQuest.id}`,
          points: mapQuest.points_reward,
        })

        completed.push({ type: 'map', points: mapQuest.points_reward })
      }
    }
  }

  return completed
}

function stripHtmlTags(str: string): string {
  return str.replace(/<[^>]*>/g, '')
}

function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    // 認証チェック: ログインユーザーのみ自分のプロフィールを更新可能
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // リクエストのuserIdがログインユーザーと一致するか検証
    if (data.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // --- 入力バリデーション ---
    if (data.display_name !== undefined) {
      if (typeof data.display_name !== 'string') {
        return NextResponse.json({ success: false, error: 'Invalid display_name' }, { status: 400 })
      }
      data.display_name = stripHtmlTags(data.display_name).slice(0, 50)
    }

    if (data.instagram_id !== undefined && data.instagram_id !== null && data.instagram_id !== '') {
      if (typeof data.instagram_id !== 'string' || !/^[a-zA-Z0-9_.]+$/.test(data.instagram_id)) {
        return NextResponse.json({ success: false, error: 'Invalid instagram_id' }, { status: 400 })
      }
      data.instagram_id = data.instagram_id.slice(0, 30)
    }

    if (data.avatar_url !== undefined && data.avatar_url !== null && data.avatar_url !== '') {
      if (typeof data.avatar_url !== 'string' || !validateUrl(data.avatar_url)) {
        return NextResponse.json({ success: false, error: 'Invalid avatar_url' }, { status: 400 })
      }
    }

    if (data.lat !== undefined && data.lat !== null) {
      const lat = Number(data.lat)
      if (isNaN(lat) || lat < -90 || lat > 90) {
        return NextResponse.json({ success: false, error: 'Invalid lat' }, { status: 400 })
      }
      data.lat = lat
    }

    if (data.lng !== undefined && data.lng !== null) {
      const lng = Number(data.lng)
      if (isNaN(lng) || lng < -180 || lng > 180) {
        return NextResponse.json({ success: false, error: 'Invalid lng' }, { status: 400 })
      }
      data.lng = lng
    }

    for (const field of ['home_country', 'home_city', 'home_state'] as const) {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        if (typeof data[field] !== 'string') {
          return NextResponse.json({ success: false, error: `Invalid ${field}` }, { status: 400 })
        }
        data[field] = stripHtmlTags(data[field]).slice(0, 100)
      }
    }

    const supabase = createServiceClient()

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: data.display_name,
        instagram_id: data.instagram_id,
        avatar_url: data.avatar_url,
        home_country: data.home_country,
        home_state: data.home_state,
        home_city: data.home_city,
        lat: data.lat,
        lng: data.lng,
        show_location_on_map: data.show_location_on_map,
      })
      .eq('id', data.userId)

    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    // Check auto-quest completion after successful profile update
    const completedQuests = await checkAutoQuests(supabase, data.userId, {
      display_name: data.display_name,
      home_country: data.home_country,
      home_city: data.home_city,
      avatar_url: data.avatar_url,
      show_location_on_map: data.show_location_on_map,
      lat: data.lat,
      lng: data.lng,
    })

    return NextResponse.json({ success: true, completedQuests })
  } catch (e) {
    console.error('Profile update error:', e)
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
