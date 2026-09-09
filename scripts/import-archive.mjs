// masu-blog（海外活動記録）の記事データを GUILD に取り込む。
// 入力: ../masu-blog/docs/articles.js, note_articles.js  → 出力: src/data/archive.json, src/data/note-articles.json
// HTMLはここでホワイトリスト整形し、画像は GitHub Pages の絶対URLに書き換える。
import fs from 'fs'
import vm from 'vm'
import path from 'path'

const SRC = process.env.MASU_BLOG_DIR || path.resolve(process.cwd(), '../masu-blog/docs')
const IMAGE_BASE = 'https://masuo444.github.io/masu-blog/'

const load = (file, name) => {
  const src = fs.readFileSync(path.join(SRC, file), 'utf8')
  const ctx = {}
  vm.createContext(ctx)
  vm.runInContext(src + `\n;__out=${name};`, ctx)
  return ctx.__out
}

const ALLOWED = new Set(['p', 'hr', 'strong', 'b', 'em', 'i', 'div', 'img', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'br', 'figure', 'figcaption', 'blockquote'])

function rewriteSrc(src) {
  if (!src) return src
  if (src.startsWith('./')) return IMAGE_BASE + src.slice(2)
  if (src.startsWith('images/')) return IMAGE_BASE + src
  return src
}

// 軽量サニタイズ: 許可タグ以外は除去、属性は img(src,alt) / a(href) / div,figure(class) のみ
function sanitize(html) {
  return html
    // script/style/iframe は中身ごと削除
    .replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (m, tag, attrs) => {
      const t = tag.toLowerCase()
      const closing = m.startsWith('</')
      if (!ALLOWED.has(t)) return ''
      if (closing) return `</${t}>`
      if (t === 'img') {
        const src = (attrs.match(/src="([^"]*)"/i) || [])[1] || ''
        const alt = (attrs.match(/alt="([^"]*)"/i) || [])[1] || ''
        if (!/^(https?:\/\/|\.\/|images\/)/.test(src)) return ''
        return `<img src="${rewriteSrc(src)}" alt="${alt.replace(/"/g, '&quot;')}" loading="lazy" />`
      }
      if (t === 'a') {
        const href = (attrs.match(/href="([^"]*)"/i) || [])[1] || ''
        if (!/^https?:\/\//.test(href)) return '<a>'
        return `<a href="${href}" target="_blank" rel="noopener noreferrer">`
      }
      if (t === 'div' || t === 'figure') {
        const cls = (attrs.match(/class="([^"]*)"/i) || [])[1] || ''
        return cls ? `<${t} class="${cls.replace(/[^a-z0-9 _-]/gi, '')}">` : `<${t}>`
      }
      if (t === 'hr' || t === 'br') return `<${t} />`
      return `<${t}>`
    })
}

const articles = load('articles.js', 'articles')
const out = articles.map((a) => ({
  id: a.id,
  num: a.num,
  category: a.category,
  country: a.country || null,
  country_en: a.country_en || null,
  year: a.year || (a.date || '').slice(0, 4),
  date: a.date,
  title: a.title,
  title_en: a.title_en || null,
  excerpt: a.excerpt || '',
  excerpt_en: a.excerpt_en || null,
  thumbnail: a.thumbnail ? rewriteSrc(a.thumbnail) : null,
  body: sanitize(a.body || ''),
  body_en: a.body_en ? sanitize(a.body_en) : null,
}))
fs.writeFileSync('src/data/archive.json', JSON.stringify(out))

const notes = load('note_articles.js', 'noteArticles')
const noteOut = notes.map((n) => ({ id: n.id, title: n.title, url: n.url, date: n.date, year: n.year, eyecatch: n.eyecatch || null, is_paid: !!n.is_paid, excerpt: (n.excerpt || '').slice(0, 140) }))
fs.writeFileSync('src/data/note-articles.json', JSON.stringify(noteOut))

const cats = {}
for (const a of out) cats[a.category] = (cats[a.category] || 0) + 1
console.log('archive:', out.length, cats)
console.log('notes:', noteOut.length, 'sizes:', fs.statSync('src/data/archive.json').size, fs.statSync('src/data/note-articles.json').size)
console.log('sample img:', (out[0].body.match(/<img [^>]+>/) || [''])[0])
