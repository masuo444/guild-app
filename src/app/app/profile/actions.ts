'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

interface UpdateProfileData {
  userId: string
  display_name: string
  instagram_id: string | null
  avatar_url: string | null
  home_country: string
  home_state: string
  home_city: string
  lat: number
  lng: number
  show_location_on_map: boolean
}

export async function updateProfile(data: UpdateProfileData) {
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
    return { success: false, error: error.message }
  }

  // キャッシュを無効化（即時反映のため）
  try {
    revalidatePath('/app/map')
    revalidatePath('/app/profile')
    revalidatePath('/app')
  } catch {
    // revalidatePath errors are non-critical
  }

  return { success: true }
}
