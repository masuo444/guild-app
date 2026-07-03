// 本番Stripeに「年額プラン」と「枡セット付き年額プラン」を作成するスクリプト。
// 実行: node scripts/create-stripe-plans.mjs
// 実行後、出力された price ID を .env.local に追記してください。
//
// 注意: Stripeの price は金額が固定（不変）です。あとで金額を変えたい場合は
// 新しい price を作り直して .env.local を更新します。
import Stripe from 'stripe'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] })
)
const stripe = new Stripe(env.STRIPE_SECRET_KEY)
const live = env.STRIPE_SECRET_KEY.startsWith('sk_live_')
console.log(`モード: ${live ? '★本番(LIVE)' : 'テスト(TEST)'}`)

// 1) 年額プラン（¥9,800/年 ＝ 2ヶ月分お得, $100/年）
const annual = await stripe.products.create({
  name: 'FOMUS GUILD Annual',
  description: '年額会員プラン（2ヶ月分お得）',
})
const annualJpy = await stripe.prices.create({
  product: annual.id, currency: 'jpy', unit_amount: 9800,
  recurring: { interval: 'year' },
})
const annualUsd = await stripe.prices.create({
  product: annual.id, currency: 'usd', unit_amount: 10000, // $100.00
  recurring: { interval: 'year' },
})

// 2) 枡セット付き年額プラン（日本国内・¥11,800/年）
const masu = await stripe.products.create({
  name: 'FOMUS GUILD Annual + Masu Set (Japan)',
  description: '年額会員＋入会特典で枡セットを発送（日本国内のみ）。',
  shippable: true,
})
const masuJpy = await stripe.prices.create({
  product: masu.id, currency: 'jpy', unit_amount: 11800,
  recurring: { interval: 'year' },
})

console.log('\n=== .env.local に以下を追記してください ===\n')
console.log(`STRIPE_PRICE_ID_ANNUAL_JPY=${annualJpy.id}`)
console.log(`STRIPE_PRICE_ID_ANNUAL_USD=${annualUsd.id}`)
console.log(`STRIPE_PRICE_ID_MASU_JPY=${masuJpy.id}`)
console.log('\n作成した商品:')
console.log(`  年額: ${annual.id}`)
console.log(`  枡セット年額: ${masu.id}`)
