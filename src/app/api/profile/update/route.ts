import { createServiceClient } from '@/lib/supabase/server'
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
) {
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
      }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

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
    await checkAutoQuests(supabase, data.userId, {
      display_name: data.display_name,
      home_country: data.home_country,
      home_city: data.home_city,
      avatar_url: data.avatar_url,
      show_location_on_map: data.show_location_on_map,
      lat: data.lat,
      lng: data.lng,
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Profile update error:', e)
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
