/**
 * Gemini で書いた「毎日の記事」をそのまま貼り付けて取り込むためのパーサ。
 *
 * 本文は既存記事と同じ形（1行目が「2026年9月13日。」、次に「どうも、まっすーです！」、
 * 絵文字始まりの行が見出し）で出てくるので、日付と見出しだけ機械的に拾う。
 * タイトルは候補を出すだけで、最終的には人が直す前提。
 */
export interface ParsedPost {
  /** 本文（前後の余白と、貼り付け時に混ざりがちな行を落としたもの） */
  body: string
  /** 記事の日付。YYYY-MM-DD。取れなければ null */
  date: string | null
  /** タイトル候補（「9月13日 ― 見出し」） */
  titleSuggestion: string | null
  /** 見出しとして拾えた行（タイトル候補の選び直し用） */
  headings: string[]
}

const DATE_RE = /^\s*(\d{4})年(\d{1,2})月(\d{1,2})日/
/** 絵文字で始まる行を見出しとみなす（記事ページ側の判定に合わせる） */
const HEADING_RE = /^\s*([\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}])\s*(.+)$/u

export function parsePastedPost(raw: string): ParsedPost {
  // Geminiからコピーすると行頭に余分な空白が入ることがあるので整える
  const lines = raw.replace(/\r\n/g, '\n').split('\n').map((l) => l.replace(/[ \t]+$/, ''))
  while (lines.length && !lines[0].trim()) lines.shift()
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop()

  let date: string | null = null
  for (const l of lines.slice(0, 3)) {
    const m = l.match(DATE_RE)
    if (m) {
      date = `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
      break
    }
  }

  const headings: string[] = []
  for (const l of lines) {
    const m = l.match(HEADING_RE)
    // 「💡 学び：」は締めのカードなので見出し候補から外す
    // 🏛️ のように異体字セレクタ(U+FE0F)が続く絵文字があるので、見出し側から取り除く
    const text = m ? m[2].replace(/^[\uFE0E\uFE0F\u200D\s]+/, '').trim() : ''
    if (m && !/^💡/.test(l.trim()) && text.length >= 4 && text.length <= 60) {
      headings.push(text)
    }
  }

  let titleSuggestion: string | null = null
  if (date) {
    const [, mm, dd] = date.split('-')
    const head = headings[0] ?? null
    titleSuggestion = head
      ? `${Number(mm)}月${Number(dd)}日 ― ${head}`
      : `${Number(mm)}月${Number(dd)}日 ― `
  }

  return { body: lines.join('\n'), date, titleSuggestion, headings }
}
