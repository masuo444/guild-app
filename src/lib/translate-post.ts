import Anthropic from '@anthropic-ai/sdk'

/**
 * 笛吹市活動記録（日本語）を英語に翻訳する。
 * 記事の「型」（日付行／あいさつ／絵文字見出し／💡 学び／ではまた！）と改行をそのまま保ち、
 * まっすーの一人称の語り口で自然な英語にする。文の追加・削除はしない。
 */
const SYSTEM = `You translate MaSU's daily journal posts from Japanese into natural, warm English for an international community.

MaSU (まっすー) is the founder of FOMUS, a Japanese wooden-masu brand, now living in Fuefuki, Yamanashi as a community producer. Keep his first-person, friendly, energetic voice.

Hard rules:
- Preserve the structure exactly, line by line: keep every blank line, every line break, and the order of paragraphs.
- Line 1 is a date like "2026年7月1日。" → write it as "July 1, 2026." on its own line.
- "どうも、まっすーです！" → "Hey, it's MaSU!" (keep the weekday if present, e.g. "Hey, it's MaSU! It's Wednesday.").
- Headings are short lines that start with an emoji. Keep the emoji and translate the heading on the same single line.
- Lines starting with "💡 学び：" become lines starting with "💡 Lesson: " followed by the translated lesson.
- "ではまた！" → "See you next time!"
- Do not add, remove, summarize, or reorder content. Do not add commentary or notes. Do not use Markdown symbols (no #, *, -).
- Keep proper nouns: FOMUS, KACHIU, Fuefuki, Isawa Onsen, Masu (the wooden cup), names of people and places. Romanize Japanese names naturally (e.g. Tsuji-san).
- Output only the translated text.`

export interface TranslatedPost { title_en: string; body_en: string }

function client() {
  return new Anthropic()
}

export async function translatePost(post: { title: string; body: string }): Promise<TranslatedPost> {
  const c = client()
  // タイトルと本文を1リクエストで。区切り行で返してもらう
  const prompt = `Translate the following post. Return the translated TITLE on the first line, then a line containing only "-----", then the translated BODY.\n\nTITLE:\n${post.title}\n\nBODY:\n${post.body}`

  const stream = c.messages.stream({
    model: 'claude-opus-5',
    max_tokens: 16000,
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    output_config: { effort: 'low' },
    messages: [{ role: 'user', content: prompt }],
  })
  const message = await stream.finalMessage()
  if (message.stop_reason === 'refusal') throw new Error('translation refused')
  const text = message.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim()
  const sep = text.indexOf('\n-----')
  if (sep < 0) throw new Error('unexpected translation format')
  const title_en = text.slice(0, sep).trim().replace(/^TITLE:\s*/i, '')
  const body_en = text.slice(sep + 6).replace(/^\s*-*\s*/, '').replace(/^BODY:\s*/i, '').trim()
  if (!title_en || !body_en) throw new Error('empty translation')
  return { title_en, body_en }
}
