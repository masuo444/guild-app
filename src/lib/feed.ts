/**
 * まっすーフィード（活動記録）の本文をレイアウト用ブロックに分解するヘルパー。
 * 本文はプレーンテキスト（Markdown記号は使わない）で、
 *   - 1行目「2026年6月2日。」= 日付
 *   - 絵文字で始まる短い行 = 小見出し
 *   - 「💡 学び：…」= 学びカード
 *   - 「ではまた！」= 結び
 * という慣習で書かれている。パーサーはそれをそのまま構造化するだけで、文字は一切変えない。
 */

export type ArticleBlock =
  | { type: 'date'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'learning'; text: string }
  | { type: 'paragraph'; lines: string[] }
  | { type: 'closing'; text: string }

const DATE_LINE = /^20\d{2}年\d{1,2}月\d{1,2}日。?$/
const CLOSING_LINE = /^ではまた[！!。]?$/
const LEARNING_PREFIX = /^💡\s*学び[：:]\s*/
// 絵文字（Extended_Pictographic）で始まる短い行を見出し扱い
const EMOJI_START = /^\p{Extended_Pictographic}/u
const HEADING_MAX = 70

export function isHeadingLine(line: string): boolean {
  const s = line.trim()
  if (!s || s.length > HEADING_MAX) return false
  if (LEARNING_PREFIX.test(s)) return false
  return EMOJI_START.test(s)
}

export function parseArticle(body: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = []
  let para: string[] = []
  const flush = () => {
    if (para.length) {
      blocks.push({ type: 'paragraph', lines: para })
      para = []
    }
  }

  for (const raw of body.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trimEnd()
    const s = line.trim()
    if (!s) { flush(); continue }
    if (blocks.length === 0 && para.length === 0 && DATE_LINE.test(s)) {
      blocks.push({ type: 'date', text: s })
      continue
    }
    if (LEARNING_PREFIX.test(s)) {
      flush()
      blocks.push({ type: 'learning', text: s.replace(LEARNING_PREFIX, '') })
      continue
    }
    if (CLOSING_LINE.test(s)) {
      flush()
      blocks.push({ type: 'closing', text: s })
      continue
    }
    if (isHeadingLine(s)) {
      flush()
      blocks.push({ type: 'heading', text: s })
      continue
    }
    para.push(s)
  }
  flush()
  return blocks
}

/** タイトル先頭の「6月2日 ― 」のような日付プレフィックスを外す（一覧では日付を別表示するため） */
export function stripDatePrefix(title: string): string {
  return title.replace(/^\d{1,2}月\d{1,2}日\s*[―\-–—|｜:：]\s*/, '').trim()
}

/** 冒頭のフック（あいさつ行の次の段落）を抜粋にする */
export function makeExcerpt(body: string, max = 100): string {
  const blocks = parseArticle(body)
  const paras = blocks.filter((b): b is Extract<ArticleBlock, { type: 'paragraph' }> => b.type === 'paragraph')
  // 「どうも、まっすーです！…」のあいさつ段落は飛ばす
  const candidate = paras.find((p) => !/^(どうも|はい、どうも|こんにちは|Hi|Hello)/.test(p.lines[0])) ?? paras[0]
  const text = (candidate?.lines.join(' ') ?? '').replace(/\s+/g, ' ').trim()
  return text.length > max ? text.slice(0, max).replace(/[、。,.\s]+$/, '') + '…' : text
}

/** 読了目安（日本語は約500字/分） */
export function readingMinutes(body: string): number {
  return Math.max(1, Math.round(body.replace(/\s/g, '').length / 500))
}

/** 「2026-06」のような月キー */
export function monthKey(iso: string): string {
  return iso.slice(0, 7)
}

/** 表示用の日付（曜日つき） */
export function formatPostDate(iso: string, language: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'short', timeZone: 'UTC',
    })
  } catch {
    return ''
  }
}

export function formatMonth(key: string, language: string): string {
  const [y, m] = key.split('-').map(Number)
  if (language === 'ja') return `${y}年${m}月`
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', timeZone: 'UTC' })
}

/**
 * 無料会員向けの冒頭プレビュー: 日付・あいさつ・冒頭段落と「最初の小見出し」までを返す。
 * 見出しが無い記事は最初の3段落まで。文字は変えず、そこで切るだけ。
 */
export function makeTeaser(body: string): string {
  const lines = body.replace(/\r\n/g, '\n').split('\n')
  const headingAt = lines.findIndex((l) => isHeadingLine(l.trim()))
  if (headingAt >= 0) return lines.slice(0, headingAt + 1).join('\n')
  // 見出しが無い記事: 最初の4段落まで
  let paragraphs = 0
  let inPara = false
  for (let i = 0; i < lines.length; i++) {
    const s = lines[i].trim()
    if (!s) { inPara = false; continue }
    if (!inPara) { paragraphs++; inPara = true }
    if (paragraphs > 4) return lines.slice(0, i).join('\n').trimEnd()
  }
  return lines.join('\n')
}
