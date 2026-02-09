// Fetch hub images from Google Places API and upload to Supabase Storage
// Usage: node scripts/fetch-hub-images.mjs
// Requires: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY and SUPABASE_SERVICE_ROLE_KEY in .env.local

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env = Object.fromEntries(
  envContent.split('\n').filter(l => l && !l.startsWith('#')).map(l => {
    const i = l.indexOf('=')
    return [l.slice(0, i), l.slice(i + 1)]
  })
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const MAPS_KEY = env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

const BUCKET = 'hub-images'

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (!buckets?.find(b => b.name === BUCKET)) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true })
    if (error) { console.error('Bucket creation error:', error); process.exit(1) }
    console.log(`✓ Created bucket: ${BUCKET}`)
  } else {
    console.log(`✓ Bucket exists: ${BUCKET}`)
  }
}

async function findPlacePhoto(name, address) {
  const query = encodeURIComponent(`${name} ${address || ''}`.trim())
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${MAPS_KEY}`
  const res = await fetch(url)
  const data = await res.json()

  if (data.results?.[0]?.photos?.[0]?.photo_reference) {
    return data.results[0].photos[0].photo_reference
  }
  return null
}

async function downloadPhoto(photoRef) {
  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${MAPS_KEY}`
  const res = await fetch(url)
  if (!res.ok) return null
  const buffer = Buffer.from(await res.arrayBuffer())
  return buffer
}

async function uploadToStorage(hubId, buffer) {
  const path = `${hubId}.jpg`
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: 'image/jpeg',
    upsert: true,
  })
  if (error) { console.error(`  Upload error:`, error.message); return null }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

async function main() {
  await ensureBucket()

  const { data: hubs, error } = await supabase.from('masu_hubs').select('id, name, address, image_url').eq('is_active', true)
  if (error) { console.error('Fetch error:', error); process.exit(1) }

  console.log(`\nProcessing ${hubs.length} hubs...\n`)

  let success = 0, skipped = 0, failed = 0

  for (let i = 0; i < hubs.length; i++) {
    const hub = hubs[i]
    console.log(`[${i + 1}/${hubs.length}] ${hub.name}`)

    if (hub.image_url) {
      console.log(`  ⏭ Already has image`)
      skipped++
      continue
    }

    // Search Places API
    const photoRef = await findPlacePhoto(hub.name, hub.address)
    if (!photoRef) {
      console.log(`  ⚠ No photo found`)
      failed++
      continue
    }

    // Download photo
    const buffer = await downloadPhoto(photoRef)
    if (!buffer) {
      console.log(`  ⚠ Download failed`)
      failed++
      continue
    }

    // Upload to Supabase Storage
    const publicUrl = await uploadToStorage(hub.id, buffer)
    if (!publicUrl) {
      failed++
      continue
    }

    // Update DB
    const { error: updateErr } = await supabase.from('masu_hubs').update({ image_url: publicUrl }).eq('id', hub.id)
    if (updateErr) {
      console.log(`  ⚠ DB update error:`, updateErr.message)
      failed++
      continue
    }

    console.log(`  ✓ Done`)
    success++

    // Rate limit: 100ms between requests
    await new Promise(r => setTimeout(r, 100))
  }

  console.log(`\n--- Summary ---`)
  console.log(`✓ Success: ${success}`)
  console.log(`⏭ Skipped: ${skipped}`)
  console.log(`⚠ Failed: ${failed}`)
}

main()
