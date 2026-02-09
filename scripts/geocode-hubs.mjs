// Geocode all hub addresses using Nominatim (OpenStreetMap) - no API key needed
// Then output SQL migration to update hubs

const hubs = [
  { name: 'Maru Hair Tokyo head spa & design', address: '66-67 Aungier Street, Dublin 2, Ireland', category: '美容院', description: '受付にあり / Located at the reception', country: 'Ireland', city: 'Dublin' },
  { name: 'DARUMA', address: '47 Dame Street, Temple Bar, Dublin 2, D02 N868, Ireland', category: '純和食', description: 'MaSU favorite spot', country: 'Ireland', city: 'Dublin' },
  { name: 'Paramount Tower Luxury Apartments - Glenwood', address: '240 E 39th St, New York, NY 10016, USA', category: 'アパート', description: null, country: 'USA', city: 'New York' },
  { name: 'クロイスターズ', address: '99 Margaret Corbin Drive, New York, NY 10040, USA', category: '美術館', description: null, country: 'USA', city: 'New York' },
  { name: 'Centre of English Studies - CES', address: '31 Dame Street, Dublin 2, D02 CX73, Ireland', category: '英語学校', description: null, country: 'Ireland', city: 'Dublin' },
  { name: 'ホニャラノイエ', address: '岐阜県揖斐郡大野町相羽283-1', category: '屋内宿泊施設', description: 'リフレッシュするなら超絶オススメ！', country: 'Japan', city: '揖斐郡大野町' },
  { name: 'Harmony Dining Music Bar', address: '大阪府大阪市中央区玉造1-3-13', category: 'バー', description: '日本語が堪能なアメリカ人のオーナーが営業しています！', country: 'Japan', city: '大阪市' },
  { name: 'BAR Red Canyon', address: '大阪府大阪市福島区福島8-17-3 2F', category: 'バー', description: 'FOMUS枡あり。とにかく雰囲気が良い', country: 'Japan', city: '大阪市' },
  { name: 'Cafe Choco Tea', address: '埼玉県坂戸市仲町1-2', category: 'カフェ', description: 'FOMUS枡あり。ふわもこアートはぜひ', country: 'Japan', city: '坂戸市' },
  { name: '用宗みなと横丁', address: '静岡県静岡市駿河区用宗2-17-2', category: '軽食店', description: '居酒屋 まっちゃん', country: 'Japan', city: '静岡市' },
  { name: 'Adam The Original Siomai sa Tisa', address: '816 Katipunan St, Cebu City, 6000 Cebu, Philippines', category: 'バー', description: 'アシュリーは、まっすー行きつけのBAR。Googleマップに載ってませんが、店は賑わってます', country: 'Philippines', city: 'Cebu City' },
  { name: "Naoki's Dining Bar", address: '869 A. S. Fortuna St, Mandaue City, Central Visayas, Philippines', category: 'バー', description: null, country: 'Philippines', city: 'Mandaue City' },
  { name: 'リップル', address: '2F, The Forum, Archbishop Reyes Ave, Cebu City, 6000 Cebu, Philippines', category: 'バー', description: null, country: 'Philippines', city: 'Cebu City' },
  { name: '割烹多ま Sushi OMAKASE TAMA', address: "8A/7C1 Thái Văn Lung, Bến Nghé, Quận 1, Hồ Chí Minh, Vietnam", category: '日本料理', description: 'FOMUSくま 滞在（閉業）', country: 'Vietnam', city: 'Ho Chi Minh City' },
  { name: '【蔵 KURA】Kaku-Uchi＆SAKE Shop', address: "40/28 Phạm Viết Chánh, Phường 19, Bình Thạnh, Hồ Chí Minh, Vietnam", category: '酒店', description: 'FOMUSくま 滞在', country: 'Vietnam', city: 'Ho Chi Minh City' },
  { name: '尾道A邸', address: '広島県尾道市尾崎本町10-7', category: null, description: null, country: 'Japan', city: '尾道市' },
  { name: '竹浪酒造店', address: '青森県つがる市木造嘉瀬', category: '日本酒醸造所', description: null, country: 'Japan', city: 'つがる市' },
  { name: '鯖江拠点', address: '福井県鯖江市落井町13-38-3', category: null, description: null, country: 'Japan', city: '鯖江市' },
  { name: 'Matcha Hero Kyoto @ Pavilion Kuala Lumpur', address: 'Lot P6.16.00, Level 6, Pavilion Kuala Lumpur, 168 Jalan Bukit Bintang, 55100 Kuala Lumpur, Malaysia', category: 'カフェ', description: null, country: 'Malaysia', city: 'Kuala Lumpur' },
  { name: 'Omakase SUSHI ORIBE - 寿司 織部', address: 'Ground Floor, Block C-1, Vipod Residences, No 6, Jalan Kia Peng, 50450 Kuala Lumpur, Malaysia', category: '寿司', description: null, country: 'Malaysia', city: 'Kuala Lumpur' },
  { name: '日本酒とおばんざい新奈', address: '奈良県奈良市東向北町6', category: '日本料理', description: null, country: 'Japan', city: '奈良市' },
  { name: 'エルカミノ', address: '京都府京都市上京区表町23', category: '古書店', description: null, country: 'Japan', city: '京都市' },
  { name: '井上呉服店', address: '京都府京都市上京区表町27-1', category: '着物販売店', description: null, country: 'Japan', city: '京都市' },
  { name: 'ライオンキッチン', address: '京都府京都市上京区表町23 桝形ビル1F', category: '日本式洋食レストラン', description: null, country: 'Japan', city: '京都市' },
  { name: '満寿形屋', address: '京都市上京区桝形通出町西入ル二神町179', category: '寿司', description: null, country: 'Japan', city: '京都市' },
  { name: 'TIKI REPUBLIK', address: 'No. 10, Ln. 100, Sec. 4, Roosevelt Rd, Zhongzheng District, Taipei City, Taiwan', category: 'バー', description: null, country: 'Taiwan', city: 'Taipei' },
  { name: 'アウル∞珈琲', address: '青森県つがる市木造末広36-8', category: 'コーヒーショップ', description: null, country: 'Japan', city: 'つがる市' },
  { name: 'AMETSUCHI KYOTO', address: '京都府京都市', category: null, description: null, country: 'Japan', city: '京都市' },
  { name: 'bar asso', address: '京都府京都市東山区林下町434', category: 'バー', description: null, country: 'Japan', city: '京都市' },
  { name: 'CAFE TOLAND カフェトゥーランド', address: "愛知県名古屋市中区大須4-11-5 Z's building 6F", category: 'カフェ', description: null, country: 'Japan', city: '名古屋市' },
  { name: '湯記口味肉鬆老店', address: '桃園市中壢區大同路161號, Taiwan', category: '食品製造業者', description: null, country: 'Taiwan', city: '中壢區' },
  { name: 'Guild', address: '佐賀県武雄市武雄町武雄7411', category: '立食形式の飲食店', description: null, country: 'Japan', city: '武雄市' },
  { name: 'CryptoBar P2P', address: '東京都中央区銀座7-2-12', category: 'バー', description: null, country: 'Japan', city: '東京' },
  { name: '力車イン', address: '岐阜県高山市末広町54', category: 'ホテル', description: null, country: 'Japan', city: '高山市' },
  { name: 'SOTOCHIKU & 89 unLtd.（パクチー銀行）', address: '千葉県安房郡鋸南町保田65-2', category: 'カフェ', description: null, country: 'Japan', city: '鋸南町' },
  { name: 'パティスリー ルナール 盛岡', address: '岩手県盛岡市中央通2-5-11', category: 'デザートショップ', description: null, country: 'Japan', city: '盛岡市' },
  { name: '吉野川ギルド', address: '徳島県吉野川市山川町前川201', category: 'シェアキッチン', description: null, country: 'Japan', city: '吉野川市' },
  { name: 'ウダツインキュベーションセンター', address: '徳島県美馬市脇町字脇町123', category: 'コミュニティセンター', description: null, country: 'Japan', city: '美馬市' },
  { name: 'ゲストハウスのどけや本館', address: '徳島県美馬市脇町大字脇町117-1', category: 'ゲストハウス', description: null, country: 'Japan', city: '美馬市' },
  { name: 'FUJITAYA BnB Bike&Yoga', address: '37-1 Nishishichijo Kitanishinocho, Shimogyo-ku, Kyoto 600-8878, Japan', category: 'ホテル', description: null, country: 'Japan', city: '京都市' },
  { name: 'cheese shop&wine.cafe 京都のチーズ屋さん プチシャレ', address: '京都府京都市東山区宮川筋4-317-6', category: 'カフェ', description: null, country: 'Japan', city: '京都市' },
]

// Nominatim geocoding (free, no API key)
async function geocode(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FomusGuildHubGeocoder/1.0' }
    })
    const data = await res.json()
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
  } catch (e) {
    console.error(`  Error geocoding: ${e.message}`)
  }
  return null
}

function escapeSql(str) {
  if (!str) return 'NULL'
  return "'" + str.replace(/'/g, "''") + "'"
}

async function main() {
  console.log('-- FOMUS Hub data refresh: delete all existing hubs and re-insert with correct locations')
  console.log('-- Generated: ' + new Date().toISOString())
  console.log('')
  console.log('DELETE FROM masu_hubs;')
  console.log('')
  console.log('INSERT INTO masu_hubs (name, description, address, country, city, lat, lng, is_active) VALUES')

  const results = []

  for (let i = 0; i < hubs.length; i++) {
    const hub = hubs[i]
    console.error(`[${i + 1}/${hubs.length}] Geocoding: ${hub.name}...`)

    const coords = await geocode(hub.address)

    // Rate limit: Nominatim requires 1 request per second
    await new Promise(r => setTimeout(r, 1100))

    const lat = coords ? coords.lat.toFixed(6) : '0'
    const lng = coords ? coords.lng.toFixed(6) : '0'

    if (!coords) {
      console.error(`  ⚠ Could not geocode: ${hub.address}`)
    } else {
      console.error(`  ✓ ${lat}, ${lng}`)
    }

    results.push({
      ...hub,
      lat,
      lng,
    })
  }

  // Output SQL
  const lines = results.map((h, i) => {
    const comma = i < results.length - 1 ? ',' : ';'
    const desc = h.description
      ? (h.category ? `${h.category} / ${h.description}` : h.description)
      : (h.category || null)
    return `(${escapeSql(h.name)}, ${escapeSql(desc)}, ${escapeSql(h.address)}, ${escapeSql(h.country)}, ${escapeSql(h.city)}, ${h.lat}, ${h.lng}, true)${comma}`
  })

  for (const line of lines) {
    console.log(line)
  }

  // Report failures
  const failures = results.filter(r => r.lat === '0')
  if (failures.length > 0) {
    console.error(`\n⚠ ${failures.length} hubs could not be geocoded:`)
    for (const f of failures) {
      console.error(`  - ${f.name}: ${f.address}`)
    }
  }
}

main()
