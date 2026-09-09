// 既存の笛吹市活動記録を一括で英訳して feed_posts.title_en / body_en に保存する。
// 実行: ANTHROPIC_API_KEY=... npx tsx scripts/translate-posts.mts [--force] [--limit N]
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import { translatePost } from '../src/lib/translate-post.ts'

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')] }))
if (!process.env.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const force = process.argv.includes('--force')
const limitArg = process.argv.indexOf('--limit')
const limit = limitArg > 0 ? Number(process.argv[limitArg + 1]) : Infinity

let q = sb.from('feed_posts').select('id, title, body, title_en').order('published_at', { ascending: true })
if (!force) q = q.is('body_en', null)
const { data: posts, error } = await q
if (error) { console.error(error.message); process.exit(1) }
console.log('to translate:', Math.min(posts!.length, limit))

let done = 0, failed = 0
for (const p of posts!.slice(0, limit)) {
  const t0 = Date.now()
  try {
    const t = await translatePost({ title: p.title, body: p.body })
    const { error: e } = await sb.from('feed_posts').update({ title_en: t.title_en, body_en: t.body_en, translated_at: new Date().toISOString() }).eq('id', p.id)
    if (e) throw new Error(e.message)
    done++
    console.log(`ok  ${p.title.slice(0, 30)} → ${t.title_en.slice(0, 50)} (${Math.round((Date.now() - t0) / 1000)}s)`)
  } catch (err) {
    failed++
    console.log(`NG  ${p.title.slice(0, 30)}: ${err instanceof Error ? err.message : err}`)
  }
}
console.log('done:', done, 'failed:', failed)
