import archiveData from '@/data/archive.json'
import noteData from '@/data/note-articles.json'

/**
 * 海外活動記録（masu-blog 由来・485本）。データは src/data/archive.json に同梱（DB不要）。
 * 画像は masu-blog の GitHub Pages から配信される。
 */
export interface ArchiveArticle {
  id: number; num: string; category: string; country: string | null; country_en: string | null
  year: string; date: string; title: string; title_en: string | null
  excerpt: string; excerpt_en: string | null; thumbnail: string | null
  body: string; body_en: string | null
}
export type ArchiveListItem = Omit<ArchiveArticle, 'body' | 'body_en'>
export interface NoteArticle { id: number | string; title: string; url: string; date: string; year: string; eyecatch: string | null; is_paid: boolean; excerpt: string }

export const REGIONS: { key: string; ja: string; en: string; emoji: string }[] = [
  { key: 'cebu', ja: 'セブ島（フィリピン）', en: 'Cebu, Philippines', emoji: '🇵🇭' },
  { key: 'malaysia', ja: 'マレーシア', en: 'Malaysia', emoji: '🇲🇾' },
  { key: 'ireland', ja: 'アイルランド', en: 'Ireland', emoji: '🇮🇪' },
  { key: 'us_spain', ja: 'アメリカ・スペイン', en: 'USA & Spain', emoji: '🇺🇸' },
  { key: 'europe2', ja: 'ヨーロッパ 第2期', en: 'Europe II', emoji: '🇪🇺' },
  { key: 'europe3', ja: 'ヨーロッパ 第3期', en: 'Europe III', emoji: '🇪🇺' },
  { key: 'europe4', ja: 'ヨーロッパ 第4期', en: 'Europe IV', emoji: '🇪🇺' },
  { key: 'mideast', ja: '中東', en: 'Middle East', emoji: '🇦🇪' },
  { key: 'singapore', ja: 'シンガポール', en: 'Singapore', emoji: '🇸🇬' },
  { key: 'taiwan', ja: '台湾', en: 'Taiwan', emoji: '🇹🇼' },
]

const ALL = archiveData as ArchiveArticle[]
const NOTES = noteData as NoteArticle[]

const stripBody = (a: ArchiveArticle): ArchiveListItem => {
  const { body: _b, body_en: _e, ...rest } = a
  void _b; void _e
  return rest
}

export function getRegionSummaries() {
  return REGIONS.map((r) => {
    const items = ALL.filter((a) => a.category === r.key)
    const dates = items.map((a) => a.date).sort()
    return { ...r, count: items.length, from: dates[0] ?? '', to: dates[dates.length - 1] ?? '', thumbnail: items.find((a) => a.thumbnail)?.thumbnail ?? null }
  }).filter((r) => r.count > 0)
}

export function getArticlesByCategory(category: string): ArchiveListItem[] {
  return ALL.filter((a) => a.category === category).sort((a, b) => a.id - b.id).map(stripBody)
}

export function getArticle(id: number): ArchiveArticle | null {
  return ALL.find((a) => a.id === id) ?? null
}

export function getNeighbors(id: number): { prev: ArchiveListItem | null; next: ArchiveListItem | null } {
  const a = getArticle(id)
  if (!a) return { prev: null, next: null }
  const list = getArticlesByCategory(a.category)
  const i = list.findIndex((x) => x.id === id)
  return { prev: i > 0 ? list[i - 1] : null, next: i >= 0 && i < list.length - 1 ? list[i + 1] : null }
}

export function getNotes(): NoteArticle[] {
  return [...NOTES].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
}

export function archiveTotal(): number { return ALL.length }

/** 無料会員向け: 先頭の段落3つだけ（画像・見出しは除く） */
export function htmlTeaser(html: string, paragraphs = 3): string {
  const ps = html.match(/<p>[\s\S]*?<\/p>/g) ?? []
  const picked: string[] = []
  for (const p of ps) {
    if (/<img /.test(p)) continue
    if (p.replace(/<[^>]+>/g, '').trim().length === 0) continue
    picked.push(p)
    if (picked.length >= paragraphs) break
  }
  return picked.join('\n')
}
