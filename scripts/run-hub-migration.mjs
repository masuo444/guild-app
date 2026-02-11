// Run hub migration against Supabase - authenticated as admin
// Usage: node scripts/run-hub-migration.mjs <admin-email> <otp-code>
// Step 1: Run without OTP to send code: node scripts/run-hub-migration.mjs admin@example.com
// Step 2: Run with OTP to execute:      node scripts/run-hub-migration.mjs admin@example.com 123456
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lszppreokxzuadxixfax.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzenBwcmVva3h6dWFkeGl4ZmF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4ODY3MTAsImV4cCI6MjA4NDQ2MjcxMH0.ePfnvTU-KGFiLnwKcF0XtbOUGeq9MfkOm7opdMxSQM8'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const email = process.argv[2]
const otp = process.argv[3]

if (!email) {
  console.log('Usage:')
  console.log('  Step 1 (send OTP): node scripts/run-hub-migration.mjs <admin-email>')
  console.log('  Step 2 (execute):  node scripts/run-hub-migration.mjs <admin-email> <otp-code>')
  process.exit(1)
}

const hubs = [
  { name: 'Maru Hair Tokyo head spa & design', description: '美容院 / 受付にあり。Located at the reception.', address: '66-67 Aungier Street, Dublin 2, Ireland', country: 'Ireland', city: 'Dublin', lat: 53.3404, lng: -6.2659 },
  { name: 'DARUMA', description: '純和食 / MaSU favorite spot', address: '47 Dame Street, Temple Bar, Dublin 2, D02 N868, Ireland', country: 'Ireland', city: 'Dublin', lat: 53.3443, lng: -6.2643 },
  { name: 'Centre of English Studies - CES', description: '英語学校', address: '31 Dame Street, Dublin 2, D02 CX73, Ireland', country: 'Ireland', city: 'Dublin', lat: 53.3440, lng: -6.2635 },
  { name: 'Paramount Tower Luxury Apartments - Glenwood', description: 'アパート', address: '240 E 39th St, New York, NY 10016, USA', country: 'USA', city: 'New York', lat: 40.7481, lng: -73.9744 },
  { name: 'クロイスターズ', description: '美術館', address: '99 Margaret Corbin Drive, New York, NY 10040, USA', country: 'USA', city: 'New York', lat: 40.8649, lng: -73.9319 },
  { name: 'ホニャラノイエ', description: '屋内宿泊施設 / リフレッシュするなら超絶オススメ！', address: '岐阜県揖斐郡大野町相羽283-1', country: 'Japan', city: '揖斐郡大野町', lat: 35.4487, lng: 136.6240 },
  { name: '力車イン', description: 'ホテル', address: '岐阜県高山市末広町54', country: 'Japan', city: '高山市', lat: 36.1413, lng: 137.2527 },
  { name: 'Harmony Dining Music Bar', description: 'バー / 日本語が堪能なアメリカ人のオーナーが営業しています！', address: '大阪府大阪市中央区玉造1-3-13', country: 'Japan', city: '大阪市', lat: 34.6743, lng: 135.5327 },
  { name: 'BAR Red Canyon', description: 'バー / FOMUS枡あり。とにかく雰囲気が良い', address: '大阪府大阪市福島区福島8-17-3 2F', country: 'Japan', city: '大阪市', lat: 34.6927, lng: 135.4863 },
  { name: 'Cafe Choco Tea', description: 'カフェ / FOMUS枡あり。ふわもこアートはぜひ', address: '埼玉県坂戸市仲町1-2', country: 'Japan', city: '坂戸市', lat: 35.9574, lng: 139.4030 },
  { name: '用宗みなと横丁', description: '軽食店 / 居酒屋 まっちゃん', address: '静岡県静岡市駿河区用宗2-17-2', country: 'Japan', city: '静岡市', lat: 34.9350, lng: 138.3700 },
  { name: 'Adam The Original Siomai sa Tisa', description: 'バー / アシュリーは、まっすー行きつけのBAR。Googleマップに載ってませんが、店は賑わってます', address: '816 Katipunan St, Cebu City, 6000 Cebu, Philippines', country: 'Philippines', city: 'Cebu City', lat: 10.2998, lng: 123.8777 },
  { name: "Naoki's Dining Bar", description: 'バー', address: '869 A. S. Fortuna St, Mandaue City, Central Visayas, Philippines', country: 'Philippines', city: 'Mandaue City', lat: 10.3422, lng: 123.9178 },
  { name: 'リップル', description: 'バー', address: '2F, The Forum, Archbishop Reyes Ave, Cebu City, 6000 Cebu, Philippines', country: 'Philippines', city: 'Cebu City', lat: 10.3187, lng: 123.9050 },
  { name: '割烹多ま Sushi OMAKASE TAMA', description: '日本料理 / FOMUSくま 滞在（閉業）', address: '8A/7C1 Thái Văn Lung, Bến Nghé, Quận 1, Hồ Chí Minh, Vietnam', country: 'Vietnam', city: 'Ho Chi Minh City', lat: 10.7809, lng: 106.7015 },
  { name: '【蔵 KURA】Kaku-Uchi＆SAKE Shop', description: '酒店 / FOMUSくま 滞在', address: '40/28 Phạm Viết Chánh, Phường 19, Bình Thạnh, Hồ Chí Minh, Vietnam', country: 'Vietnam', city: 'Ho Chi Minh City', lat: 10.8009, lng: 106.7090 },
  { name: '尾道A邸', description: null, address: '広島県尾道市尾崎本町10-7', country: 'Japan', city: '尾道市', lat: 34.4089, lng: 133.2051 },
  { name: '竹浪酒造店', description: '日本酒醸造所', address: '青森県つがる市木造嘉瀬', country: 'Japan', city: 'つがる市', lat: 40.8080, lng: 140.3700 },
  { name: 'アウル∞珈琲', description: 'コーヒーショップ', address: '青森県つがる市木造末広36-8', country: 'Japan', city: 'つがる市', lat: 40.8090, lng: 140.3690 },
  { name: '鯖江拠点', description: null, address: '福井県鯖江市落井町13-38-3', country: 'Japan', city: '鯖江市', lat: 35.9470, lng: 136.1900 },
  { name: 'Matcha Hero Kyoto @ Pavilion Kuala Lumpur', description: 'カフェ', address: 'Lot P6.16.00, Level 6, Pavilion Kuala Lumpur, 168 Jalan Bukit Bintang, 55100 Kuala Lumpur, Malaysia', country: 'Malaysia', city: 'Kuala Lumpur', lat: 3.1488, lng: 101.7133 },
  { name: 'Omakase SUSHI ORIBE - 寿司 織部', description: '寿司', address: 'Ground Floor, Block C-1, Vipod Residences, No 6, Jalan Kia Peng, 50450 Kuala Lumpur, Malaysia', country: 'Malaysia', city: 'Kuala Lumpur', lat: 3.1515, lng: 101.7170 },
  { name: '日本酒とおばんざい新奈', description: '日本料理', address: '奈良県奈良市東向北町6', country: 'Japan', city: '奈良市', lat: 34.6851, lng: 135.8279 },
  { name: 'エルカミノ', description: '古書店', address: '京都府京都市上京区表町23', country: 'Japan', city: '京都市', lat: 35.0303, lng: 135.7703 },
  { name: '井上呉服店', description: '着物販売店', address: '京都府京都市上京区表町27-1', country: 'Japan', city: '京都市', lat: 35.0303, lng: 135.7700 },
  { name: 'ライオンキッチン', description: '日本式洋食レストラン', address: '京都府京都市上京区表町23 桝形ビル1F', country: 'Japan', city: '京都市', lat: 35.0303, lng: 135.7703 },
  { name: '満寿形屋', description: '寿司', address: '京都市上京区桝形通出町西入ル二神町179', country: 'Japan', city: '京都市', lat: 35.0303, lng: 135.7710 },
  { name: 'AMETSUCHI KYOTO', description: null, address: '京都府京都市', country: 'Japan', city: '京都市', lat: 35.0116, lng: 135.7681 },
  { name: 'bar asso', description: 'バー', address: '京都府京都市東山区林下町434', country: 'Japan', city: '京都市', lat: 35.0065, lng: 135.7815 },
  { name: 'FUJITAYA BnB Bike&Yoga', description: 'ホテル', address: '37-1 Nishishichijo Kitanishinocho, Shimogyo-ku, Kyoto 600-8878, Japan', country: 'Japan', city: '京都市', lat: 34.9898, lng: 135.7338 },
  { name: 'cheese shop&wine.cafe 京都のチーズ屋さん プチシャレ', description: 'カフェ', address: '京都府京都市東山区宮川筋4-317-6', country: 'Japan', city: '京都市', lat: 34.9980, lng: 135.7720 },
  { name: 'TIKI REPUBLIK', description: 'バー', address: 'No. 10, Ln. 100, Sec. 4, Roosevelt Rd, Zhongzheng District, Taipei City, Taiwan', country: 'Taiwan', city: 'Taipei', lat: 25.0120, lng: 121.5340 },
  { name: '湯記口味肉鬆老店', description: '食品製造業者', address: '桃園市中壢區大同路161號', country: 'Taiwan', city: '中壢區', lat: 24.9570, lng: 121.2260 },
  { name: 'CAFE TOLAND カフェトゥーランド', description: 'カフェ', address: "愛知県名古屋市中区大須4-11-5 Z's building 6F", country: 'Japan', city: '名古屋市', lat: 35.1560, lng: 136.9080 },
  { name: 'Guild', description: '立食形式の飲食店', address: '佐賀県武雄市武雄町武雄7411', country: 'Japan', city: '武雄市', lat: 33.1950, lng: 130.0190 },
  { name: 'CryptoBar P2P', description: 'バー', address: '東京都中央区銀座7-2-12', country: 'Japan', city: '東京', lat: 35.6692, lng: 139.7640 },
  { name: 'SOTOCHIKU & 89 unLtd.（パクチー銀行）', description: 'カフェ', address: '千葉県安房郡鋸南町保田65-2', country: 'Japan', city: '鋸南町', lat: 35.1460, lng: 139.8490 },
  { name: 'ルナール', description: 'デザートショップ', address: '岩手県盛岡市上太田上吉本24-3', country: 'Japan', city: '盛岡市', lat: 39.6905, lng: 141.0833 },
  { name: '吉野川ギルド', description: 'シェアキッチン', address: '徳島県吉野川市山川町前川201', country: 'Japan', city: '吉野川市', lat: 34.0290, lng: 134.1730 },
  { name: 'ウダツインキュベーションセンター', description: 'コミュニティセンター', address: '徳島県美馬市脇町字脇町123', country: 'Japan', city: '美馬市', lat: 34.0660, lng: 134.1480 },
  { name: 'ゲストハウスのどけや本館', description: 'ゲストハウス', address: '徳島県美馬市脇町大字脇町117-1', country: 'Japan', city: '美馬市', lat: 34.0660, lng: 134.1480 },
]

async function main() {
  if (!otp) {
    // Step 1: Send OTP
    console.log(`Sending OTP to ${email}...`)
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) {
      console.error('Error sending OTP:', error.message)
      process.exit(1)
    }
    console.log(`✓ OTP sent to ${email}`)
    console.log(`Run again with the OTP code: node scripts/run-hub-migration.mjs ${email} <code>`)
    return
  }

  // Step 2: Verify OTP and execute
  console.log(`Verifying OTP for ${email}...`)
  const { error: authError } = await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: 'email',
  })
  if (authError) {
    console.error('Auth error:', authError.message)
    process.exit(1)
  }
  console.log('✓ Authenticated as admin')

  // Delete existing hubs
  console.log('Deleting all existing hubs...')
  const { error: deleteError } = await supabase.from('masu_hubs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (deleteError) {
    console.error('Delete error:', deleteError)
    process.exit(1)
  }
  console.log('✓ Deleted all existing hubs')

  // Insert new hubs
  console.log(`Inserting ${hubs.length} hubs...`)
  const { data, error: insertError } = await supabase.from('masu_hubs').insert(
    hubs.map(h => ({
      name: h.name,
      description: h.description,
      address: h.address,
      country: h.country,
      city: h.city,
      lat: h.lat,
      lng: h.lng,
      is_active: true,
    }))
  ).select('id, name')

  if (insertError) {
    console.error('Insert error:', insertError)
    process.exit(1)
  }

  console.log(`\n✓ Successfully inserted ${data.length} hubs!`)
}

main()
