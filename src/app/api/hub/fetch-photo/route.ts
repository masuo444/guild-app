import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { ADMIN_EMAILS } from '@/lib/access'

/**
 * Google Maps URLからPlace写真を取得してSupabase Storageに保存
 * POST { hubId, googleMapsUrl }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin check
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin' || ADMIN_EMAILS.includes(user.email as typeof ADMIN_EMAILS[number])
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { hubId, googleMapsUrl } = await request.json()

    if (!hubId || !googleMapsUrl) {
      return NextResponse.json({ error: 'hubId and googleMapsUrl required' }, { status: 400 })
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 })
    }

    // Google Maps URLからPlace名を抽出
    const placeName = extractPlaceName(googleMapsUrl)
    const coords = extractCoords(googleMapsUrl)

    if (!placeName && !coords) {
      return NextResponse.json({ error: 'Could not extract place info from URL' }, { status: 400 })
    }

    // Google Places API Text Search で場所を検索
    const query = placeName || `${coords!.lat},${coords!.lng}`
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}${coords ? `&location=${coords.lat},${coords.lng}&radius=500` : ''}&key=${apiKey}`

    const searchRes = await fetch(searchUrl)
    const searchData = await searchRes.json()

    if (!searchData.results || searchData.results.length === 0) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 })
    }

    const place = searchData.results[0]

    if (!place.photos || place.photos.length === 0) {
      return NextResponse.json({ error: 'No photos available for this place' }, { status: 404 })
    }

    // 最初の写真を取得
    const photoRef = place.photos[0].photo_reference
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${apiKey}`

    // 写真をダウンロード
    const photoRes = await fetch(photoUrl)
    if (!photoRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch photo' }, { status: 500 })
    }

    const photoBuffer = await photoRes.arrayBuffer()
    const contentType = photoRes.headers.get('content-type') || 'image/jpeg'
    const ext = contentType.includes('png') ? 'png' : 'jpg'

    // Supabase Storageにアップロード
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const filePath = `hub-photos/${hubId}.${ext}`

    await supabaseAdmin.storage
      .from('avatars')
      .upload(filePath, photoBuffer, {
        contentType,
        upsert: true,
      })

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(filePath)

    // Hub の image_url を更新
    await supabaseAdmin
      .from('masu_hubs')
      .update({ image_url: publicUrl })
      .eq('id', hubId)

    return NextResponse.json({ success: true, image_url: publicUrl })

  } catch (error) {
    console.error('Fetch place photo error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// Google Maps URLからPlace名を抽出
function extractPlaceName(url: string): string | null {
  // /place/Place+Name/@... or /place/Place+Name/data=...
  const match = url.match(/\/place\/([^/@]+)/)
  if (match) {
    return decodeURIComponent(match[1].replace(/\+/g, ' '))
  }
  return null
}

// Google Maps URLから座標を抽出
function extractCoords(url: string): { lat: number; lng: number } | null {
  // @lat,lng
  const match1 = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
  if (match1) {
    return { lat: parseFloat(match1[1]), lng: parseFloat(match1[2]) }
  }
  // !3d{lat}!4d{lng}
  const match2 = url.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/)
  if (match2) {
    return { lat: parseFloat(match2[1]), lng: parseFloat(match2[2]) }
  }
  return null
}
