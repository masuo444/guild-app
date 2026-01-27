import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Profile update error:', e)
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
