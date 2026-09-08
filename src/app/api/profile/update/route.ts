import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function stripHtmlTags(str: string): string {
  return str.replace(/<[^>]*>/g, '')
}

function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:'
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

    const updateData: Record<string, unknown> = {
      display_name: data.display_name,
      instagram_id: data.instagram_id,
      avatar_url: data.avatar_url,
      home_country: data.home_country,
      home_state: data.home_state,
      home_city: data.home_city,
      lat: data.lat,
      lng: data.lng,
    }
    // show_location_on_map が明示的に送信された場合のみ更新（未送信時は既存値を維持）
    if (typeof data.show_location_on_map === 'boolean') {
      updateData.show_location_on_map = data.show_location_on_map
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', data.userId)

    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    // Check auto-quest completion after successful profile update
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Profile update error:', e)
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
