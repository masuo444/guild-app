// まっすーの日次記事(Markdown)をフィード(feed_posts)に取り込むスクリプト。
//   テスト（先頭2本のみ）: node scripts/import-feed.mjs
//   全部一括:            node scripts/import-feed.mjs --all
// 全て無料公開(is_premium=false)。タイトル重複の投稿はスキップ（再実行安全）。
import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const SRC = '/Users/masuo/Documents/Codex/2026-07-03/files-mentioned-by-the-user-txt/outputs/day-files'
const ALL = process.argv.includes('--all')

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] })
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

// 管理者(まっすー)のuser idを取得してauthorに設定
let authorId = null
try {
  const { data: { users } } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const admin = users.find(u => u.email?.toLowerCase() === 'keisukendo414@gmail.com')
  authorId = admin?.id ?? null
} catch { /* 取れなければ null のまま */ }

// 対象ファイル（2026-06-XX.md のみ、日付昇順）
let files = readdirSync(SRC).filter(f => /^2026-06-\d{2}\.md$/.test(f)).sort()
if (!ALL) files = files.slice(0, 2) // テストは先頭2本

console.log(`モード: ${ALL ? '全部(' + files.length + '本)' : 'テスト(先頭2本)'} / author=${authorId ?? 'null'}`)

let inserted = 0, skipped = 0
for (const f of files) {
  const m = f.match(/^2026-06-(\d{2})\.md$/)
  const day = parseInt(m[1], 10)
  const title = `2026年6月${day}日`
  const raw = readFileSync(join(SRC, f), 'utf8')
  // 先頭の日付行（例「2026年6月1日。」）はタイトルと重複するので除去
  const bodyLines = raw.split('\n')
  if (/^2026年6月\d+日。?$/.test(bodyLines[0]?.trim() ?? '')) bodyLines.shift()
  const body = bodyLines.join('\n').replace(/^\n+/, '').trim()
  const publishedAt = `2026-06-${m[1]}T09:00:00+09:00`

  // 重複チェック（同タイトルが既にあればスキップ）
  const { data: existing } = await sb.from('feed_posts').select('id').eq('title', title).limit(1)
  if (existing && existing.length) { skipped++; console.log(`  skip: ${title}（既存）`); continue }

  const { error } = await sb.from('feed_posts').insert({
    author_id: authorId,
    title,
    body,
    is_premium: false,
    published_at: publishedAt,
  })
  if (error) { console.log(`  ❌ ${title}: ${error.message}`); continue }
  inserted++
  console.log(`  ✅ ${title}（${body.length}字）`)
}
console.log(`\n完了: 新規${inserted}件 / スキップ${skipped}件`)
