// 西野風に書き直した記事(out/*.md)を feed_posts に反映するスクリプト。
//   確認のみ（dry-run）: node scripts/apply-rewrites.mjs
//   実際に反映:         node scripts/apply-rewrites.mjs --apply
// 元記事より短い場合は警告（「削らない」ルールの安全確認）。
import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'

const OUT = '/private/tmp/claude-501/-Users-masuo/ba1c1fb7-da02-410e-856e-6af69a786175/scratchpad/nishino/out'
const SRC = '/Users/masuo/Documents/Codex/2026-07-03/files-mentioned-by-the-user-txt/outputs/day-files'
const APPLY = process.argv.includes('--apply')

const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^["']|["']$/g,'')]}))
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}})

const files = readdirSync(OUT).filter(f=>/^2026-06-\d{2}\.md$/.test(f)).sort()
console.log(`モード: ${APPLY ? '★反映(--apply)' : '確認のみ(dry-run)'} / 出力ファイル ${files.length}本\n`)

let ok=0, warn=0, applied=0, failed=0
for (const f of files) {
  const day = parseInt(f.match(/2026-06-(\d{2})\.md/)[1],10)
  const raw = readFileSync(join(OUT,f),'utf8')
  const nl = raw.indexOf('\n')
  const firstLine = raw.slice(0, nl).trim()
  if (!firstLine.startsWith('TITLE:')) { console.log(`❌ ${f}: 1行目がTITLE:で始まっていない`); failed++; continue }
  const title = firstLine.replace(/^TITLE:\s*/, '').trim()
  const body = raw.slice(nl+1).replace(/^\s*\n/, '').trim()

  // 元記事の長さ（先頭の日付行を除く）と比較
  const srcPath = join(SRC, f)
  let srcLen = 0
  if (existsSync(srcPath)) {
    const s = readFileSync(srcPath,'utf8').split('\n')
    if (/^2026年6月\d+日。?$/.test(s[0]?.trim()??'')) s.shift()
    srcLen = s.join('\n').trim().length
  }
  const flag = body.length < srcLen ? '⚠️短い' : 'OK'
  if (flag !== 'OK') warn++; else ok++
  console.log(`${flag==='OK'?'✅':'⚠️ '} 6/${day}  本文${body.length}字(元${srcLen}字)  「${title}」`)

  if (APPLY) {
    const { error } = await sb.from('feed_posts').update({ title, body }).eq('title', `2026年6月${day}日`)
    if (error) { console.log(`   ❌ 反映失敗: ${error.message}`); failed++ }
    else applied++
  }
}
console.log(`\n集計: OK ${ok} / 短い警告 ${warn} / 失敗 ${failed}${APPLY?` / 反映 ${applied}`:''}`)
if (!APPLY) console.log('問題なければ `node scripts/apply-rewrites.mjs --apply` で反映します。')
