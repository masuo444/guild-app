// Refresh all MASU Hub data with official Google Maps names/addresses
// Usage: node scripts/refresh-all-hubs.mjs
// Uses service_role key — no OTP authentication needed

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load .env.local
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env = Object.fromEntries(
  envContent.split('\n').filter(l => l && !l.startsWith('#')).map(l => {
    const i = l.indexOf('=')
    return [l.slice(0, i), l.slice(i + 1)]
  })
)

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
)

const hubs = [
  // Ireland - Dublin
  { name: 'MARU HAIR TOKYO hair, head spa & design', description: '美容院 / 受付にあり。Located at the reception.', address: '66/67 Aungier Street, Dublin 2, Ireland', country: 'Ireland', city: 'Dublin', lat: 53.3404, lng: -6.2659 },
  { name: 'DARUMA', description: '純和食 / MaSU favorite spot', address: '13 Parliament Street, Temple Bar, Dublin 2, D02 P658, Ireland', country: 'Ireland', city: 'Dublin', lat: 53.3455, lng: -6.2660 },
  { name: 'Centre of English Studies (CES)', description: '英語学校', address: '31 Dame St, Dublin 2, D02 CX73, Ireland', country: 'Ireland', city: 'Dublin', lat: 53.3440, lng: -6.2635 },
  { name: 'Matcha Matsukawa', description: 'カフェ', address: "Unit 1 George's Dock, Dublin, D01 FP60, Ireland", country: 'Ireland', city: 'Dublin', lat: 53.3490, lng: -6.2477 },
  { name: 'Matsukawa', description: null, address: '8 Queen Street, Smithfield, Dublin 7, D07 Y683, Ireland', country: 'Ireland', city: 'Dublin', lat: 53.3485, lng: -6.2780 },
  // Ireland - Tullamore
  { name: 'Charleville Castle', description: '城', address: 'Charleville Castle, Tullamore, Co. Offaly, R35 RP77, Ireland', country: 'Ireland', city: 'Tullamore', lat: 53.2605, lng: -7.5279 },
  // Ireland - Galway
  { name: 'WA SUSHI (WA CAFE)', description: 'カフェ', address: '13 New Dock Street, Galway, Ireland', country: 'Ireland', city: 'Galway', lat: 53.2700, lng: -9.0525 },
  // USA - New York
  { name: 'Paramount Tower', description: 'アパート', address: '240 East 39th Street, New York, NY 10016, USA', country: 'USA', city: 'New York', lat: 40.7481, lng: -73.9744 },
  { name: 'The Met Cloisters', description: '美術館', address: '99 Margaret Corbin Drive, Fort Tryon Park, New York, NY 10040, USA', country: 'USA', city: 'New York', lat: 40.8649, lng: -73.9319 },
  // Portugal - Funchal
  { name: 'FugaCidade', description: 'バー', address: 'Rua Conde de Canavial 22, Funchal, Madeira 9000-024, Portugal', country: 'Portugal', city: 'Funchal', lat: 32.6478, lng: -16.9148 },
  // Georgia - Tbilisi
  { name: 'SOMA Noodle Cafe', description: 'ラーメン', address: '39 Irakli Abashidze Street, Tbilisi 0179, Georgia', country: 'Georgia', city: 'Tbilisi', lat: 41.7082, lng: 44.7632 },
  // UAE - Dubai
  { name: 'KOBEYa', description: null, address: 'Marina Gate 1 Marsa, Dubai, United Arab Emirates', country: 'UAE', city: 'Dubai', lat: 25.0868, lng: 55.1476 },
  // Japan - 岐阜
  { name: 'ホニャラノイエ', description: '屋内宿泊施設 / リフレッシュするなら超絶オススメ！', address: '〒501-0522 岐阜県揖斐郡大野町大字相羽283-1', country: 'Japan', city: '揖斐郡大野町', lat: 35.4551, lng: 136.6342 },
  { name: 'インターナショナル旅籠 力車イン', description: 'ホテル', address: '〒506-0016 岐阜県高山市末広町54', country: 'Japan', city: '高山市', lat: 36.1437, lng: 137.2553 },
  // Japan - 大阪
  { name: 'ダイニングミュージックバー ハーモニー（Harmony）', description: 'バー / 日本語が堪能なアメリカ人のオーナーが営業しています！', address: '大阪府大阪市中央区玉造1-3-13', country: 'Japan', city: '大阪市', lat: 34.6743, lng: 135.5327 },
  { name: 'Bar Red Canyon', description: 'バー / FOMUS枡あり。とにかく雰囲気が良い', address: '大阪府大阪市福島区福島8-17-3 2F', country: 'Japan', city: '大阪市', lat: 34.6976, lng: 135.4840 },
  // Japan - 埼玉
  { name: 'Cafe Choco Tea（カフェ・チョコティー）', description: 'カフェ / FOMUS枡あり。ふわもこアートはぜひ', address: '〒350-0227 埼玉県坂戸市仲町1-2', country: 'Japan', city: '坂戸市', lat: 35.9619, lng: 139.3954 },
  // Japan - 静岡
  { name: '用宗みなと横丁', description: '軽食店 / 居酒屋 まっちゃん', address: '〒421-0122 静岡県静岡市駿河区用宗2丁目17-2', country: 'Japan', city: '静岡市', lat: 34.9240, lng: 138.3661 },
  // Philippines - Cebu
  { name: 'Adam The Original Siomai sa Tisa', description: 'バー / アシュリーは、まっすー行きつけのBAR。Googleマップに載ってませんが、店は賑わってます', address: '816 Katipunan St, Cebu City, 6000 Cebu, Philippines', country: 'Philippines', city: 'Cebu City', lat: 10.3026, lng: 123.8710 },
  { name: "Naoki's Dining Bar", description: 'バー', address: '869 A. S. Fortuna St, Mandaue City, Central Visayas, Philippines', country: 'Philippines', city: 'Mandaue City', lat: 10.3405, lng: 123.9213 },
  { name: 'リップル', description: 'バー', address: '1 Paseo Saturnino, Banilad, Cebu City, 6000 Philippines', country: 'Philippines', city: 'Cebu City', lat: 10.3431, lng: 123.9112 },
  // Vietnam - Ho Chi Minh City
  { name: '割烹多ま Sushi OMAKASE TAMA (Japanese Cuisine)', description: '日本料理 / FOMUSくま 滞在（閉業）', address: '8A/7C1 Thái Văn Lung, Bến Nghé, Quận 1, Hồ Chí Minh, Vietnam', country: 'Vietnam', city: 'Ho Chi Minh City', lat: 10.7795, lng: 106.7051 },
  { name: 'すなっくS+ Snack & Bar', description: null, address: '42 Mê Linh, Phường 19, Bình Thạnh, Hồ Chí Minh, Vietnam', country: 'Vietnam', city: 'Ho Chi Minh City', lat: 10.7897, lng: 106.7096 },
  { name: '【蔵 KURA】Kaku-Uchi＆SAKE Shop', description: '酒店 / FOMUSくま 滞在', address: '40/28 Phạm Viết Chánh, Phường 19, Bình Thạnh, Hồ Chí Minh, Vietnam', country: 'Vietnam', city: 'Ho Chi Minh City', lat: 10.7897, lng: 106.7109 },
  // Japan - 広島
  { name: '尾道A邸', description: null, address: '〒722-0054 広島県尾道市尾崎本町10-7', country: 'Japan', city: '尾道市', lat: 34.4109, lng: 133.2109 },
  { name: '佐木島アートギャラリー (Sagishima Art Gallery)', description: 'アートギャラリー', address: '広島県三原市鷺浦町向田野浦', country: 'Japan', city: '三原市', lat: 34.3468, lng: 133.1237 },
  // Japan - 青森
  { name: '株式会社 竹浪酒造店', description: '日本酒醸造所', address: '〒038-3662 青森県北津軽郡板柳町板柳土井113-1', country: 'Japan', city: '板柳町', lat: 40.6966, lng: 140.4552 },
  { name: 'アウル∞珈琲', description: 'コーヒーショップ', address: '〒038-3133 青森県つがる市木造末広36-8', country: 'Japan', city: 'つがる市', lat: 40.8125, lng: 140.3835 },
  // Malaysia - Kuala Lumpur
  { name: 'Matcha Hero Kyoto @ Pavilion Kuala Lumpur', description: 'カフェ', address: 'Lot P6.16.00, Level 6, Tokyo Street, Pavilion Kuala Lumpur, 168 Jalan Bukit Bintang, 55100 Kuala Lumpur, Malaysia', country: 'Malaysia', city: 'Kuala Lumpur', lat: 3.1488, lng: 101.7133 },
  { name: 'SUSHI ORIBE KL（寿司 織部）', description: '寿司', address: 'Vipod Residences, Ground Floor Block C-1, No 6, Jalan Kia Peng, 50450 Kuala Lumpur, Malaysia', country: 'Malaysia', city: 'Kuala Lumpur', lat: 3.1522, lng: 101.7127 },
  // Japan - 奈良
  { name: '新奈（日本酒とおばんざい）', description: '日本料理', address: '奈良県奈良市東向北町6', country: 'Japan', city: '奈良市', lat: 34.6851, lng: 135.8279 },
  // Japan - 京都
  { name: 'El camino（エルカミノ）', description: '古書店', address: '〒602-0823 京都府京都市上京区三芳町132-1', country: 'Japan', city: '京都市', lat: 35.0290, lng: 135.7700 },
  { name: '井上呉服店', description: '着物販売店', address: '〒602-0828 京都府京都市上京区出町通桝形上る二神町166', country: 'Japan', city: '京都市', lat: 35.0300, lng: 135.7705 },
  { name: 'LION KITCHEN（ライオンキッチン）', description: '日本式洋食レストラン', address: '〒602-0825 京都府京都市上京区表町23 桝形ビル1F', country: 'Japan', city: '京都市', lat: 35.0304, lng: 135.7680 },
  { name: '満寿形屋', description: '寿司', address: '京都府京都市上京区桝形通出町西入ル二神町179', country: 'Japan', city: '京都市', lat: 35.0303, lng: 135.7710 },
  { name: 'bar asso', description: 'バー', address: '〒605-0062 京都府京都市東山区林下町434', country: 'Japan', city: '京都市', lat: 35.0052, lng: 135.7772 },
  { name: 'FUJITAYA BnB Bike&Yoga', description: 'ホテル', address: '37-1, Nishishichijo Kitanishinocho, Shimogyo-ku, Kyoto-shi, 600-8878, Japan', country: 'Japan', city: '京都市', lat: 34.9898, lng: 135.7338 },
  { name: '京都のチーズ屋さん プチシャレ', description: 'カフェ', address: '京都市東山区山田町494', country: 'Japan', city: '京都市', lat: 34.9969, lng: 135.7701 },
  { name: 'ノマドマ伏見 風と土が混ざり合うコワーキングスペース by ColiveKyoto', description: 'コワーキングスペース', address: '〒612-8081 京都市伏見区新町4-469 ベルエール桃山B棟1階奥', country: 'Japan', city: '京都市', lat: 34.9321, lng: 135.7636 },
  // Taiwan
  { name: 'TIKI REPUBLIK', description: 'バー', address: '新北市貢寮區東興街17-2號', country: 'Taiwan', city: '貢寮區', lat: 25.0193, lng: 121.9500 },
  { name: '湯記口味肉松老店', description: '食品製造業者', address: '桃園市中壢區大同路161號', country: 'Taiwan', city: '中壢區', lat: 24.9563, lng: 121.2217 },
  // Japan - 愛知
  { name: 'CAFE TOLAND カフェトゥーランド', description: 'カフェ', address: "〒460-0011 愛知県名古屋市中区大須4丁目11-5 Z's building 6F", country: 'Japan', city: '名古屋市', lat: 35.1584, lng: 136.9063 },
  // Japan - 佐賀
  { name: 'Guild（ギルド）', description: '立食形式の飲食店', address: '佐賀県武雄市武雄町本町7329', country: 'Japan', city: '武雄市', lat: 33.1956, lng: 130.0158 },
  // Japan - 東京
  { name: 'CryptoBar P2P', description: 'バー', address: '〒104-0061 東京都中央区銀座5-6-8 1F', country: 'Japan', city: '東京', lat: 35.6710, lng: 139.7630 },
  // Japan - 千葉
  { name: 'SOTOCHIKU & 89 unLtd. （パクチー銀行）', description: 'カフェ', address: '〒299-1902 千葉県安房郡鋸南町保田65-2', country: 'Japan', city: '鋸南町', lat: 35.1410, lng: 139.8379 },
  // Japan - 岩手
  { name: 'ルナール', description: 'デザートショップ', address: '岩手県盛岡市上太田上吉本24-3', country: 'Japan', city: '盛岡市', lat: 39.6905, lng: 141.0833 },
  // Japan - 徳島
  { name: '吉野川ギルド', description: 'シェアキッチン', address: '〒779-3403 徳島県吉野川市山川町前川201', country: 'Japan', city: '吉野川市', lat: 34.0574, lng: 134.2387 },
  { name: 'ウダツインキュベーションセンター', description: 'コミュニティセンター', address: '美馬市脇町字脇町123', country: 'Japan', city: '美馬市', lat: 34.0682, lng: 134.1460 },
  { name: 'ゲストハウスのどけや本館', description: 'ゲストハウス', address: '〒779-3610 徳島県美馬市脇町大字脇町117-1', country: 'Japan', city: '美馬市', lat: 34.0687, lng: 134.1457 },
]

async function main() {
  console.log('Deleting all existing hubs...')
  const { error: delErr } = await supabase.from('masu_hubs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (delErr) { console.error('Delete error:', delErr); process.exit(1) }
  console.log('✓ Deleted')

  console.log(`Inserting ${hubs.length} hubs...`)
  const { data, error: insErr } = await supabase.from('masu_hubs').insert(
    hubs.map(h => ({ ...h, is_active: true }))
  ).select('id, name')

  if (insErr) { console.error('Insert error:', insErr); process.exit(1) }
  console.log(`\n✓ ${data.length} hubs inserted!`)
  data.forEach(h => console.log(`  - ${h.name}`))
}

main()
