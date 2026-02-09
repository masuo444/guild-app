import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://lszppreokxzuadxixfax.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzenBwcmVva3h6dWFkeGl4ZmF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4ODY3MTAsImV4cCI6MjA4NDQ2MjcxMH0.ePfnvTU-KGFiLnwKcF0XtbOUGeq9MfkOm7opdMxSQM8'
)

const newHubs = [
  { name: '松川抹茶', description: 'カフェ', address: 'Unit 1 George\'s Dock, Dublin, D01 FP60, Ireland', country: 'Ireland', city: 'Dublin', lat: 53.3490, lng: -6.2477 },
  { name: '松川', description: null, address: '8 Queen Street, Smithfield, Dublin 7, D07 Y683, Ireland', country: 'Ireland', city: 'Dublin', lat: 53.3485, lng: -6.2780 },
  { name: 'チャールビルーキャッスル', description: '城', address: 'Charleville Castle, Tullamore, Co. Offaly, Ireland, R35 RP77', country: 'Ireland', city: 'Tullamore', lat: 53.2745, lng: -7.4930 },
  { name: 'フーガ ビールバー', description: 'バー', address: 'R. do Conde de Canavial 22, 9000-024 Funchal, Portugal', country: 'Portugal', city: 'Funchal', lat: 32.6480, lng: -16.9080 },
  { name: 'SOMA Noodle Bar', description: 'ラーメン', address: '72 Merab Kostava St, Tbilisi 0171, Georgia', country: 'Georgia', city: 'Tbilisi', lat: 41.7098, lng: 44.7930 },
  { name: 'Kobeya', description: null, address: 'Marina Gate 1 Marsa, Dubai, United Arab Emirates', country: 'UAE', city: 'Dubai', lat: 25.0800, lng: 55.1400 },
  { name: 'Wacafe', description: 'カフェ', address: '13 New Dock Street, Galway, Ireland', country: 'Ireland', city: 'Galway', lat: 53.2707, lng: -9.0568 },
  { name: '佐木島アートギャラリー', description: 'アートギャラリー', address: '広島県三原市鷺浦町', country: 'Japan', city: '三原市', lat: 34.3300, lng: 133.1000 },
  { name: 'ノマドマ伏見', description: null, address: '京都府京都市伏見区新町4丁目469 ベルエール桃山B棟 1階奥', country: 'Japan', city: '京都市', lat: 34.9350, lng: 135.7620 },
]

async function main() {
  const { error: authError } = await supabase.auth.verifyOtp({
    email: 'keisukendo414@gmail.com',
    token: process.argv[2],
    type: 'email',
  })
  if (authError) { console.error('Auth error:', authError.message); process.exit(1) }
  console.log('✓ Authenticated')

  const { data, error } = await supabase.from('masu_hubs').insert(
    newHubs.map(h => ({ ...h, is_active: true }))
  ).select('id, name')

  if (error) { console.error('Insert error:', error); process.exit(1) }
  console.log(`✓ Inserted ${data.length} hubs:`)
  data.forEach(h => console.log(`  - ${h.name}`))
}

main()
