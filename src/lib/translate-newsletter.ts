import Anthropic from '@anthropic-ai/sdk'

/**
 * FOMUS GUILD のメルマガ（件名＋本文）を日本語から英語に翻訳する。
 * 海外会員にとっては英語版が「唯一読む版」なので、直訳ではなく
 * それ単体で成立する自然な英文にする。用語はアプリ内のi18n表記に揃える。
 */
const SYSTEM = `You translate FOMUS GUILD newsletters from Japanese into natural English for members around the world.

FOMUS GUILD is an invitation-based membership community run by MaSU (まっすー), founder of FOMUS, a Japanese brand of wooden masu cups, based in Fuefuki, Yamanashi. Most international members read only the English version, so it has to stand on its own — never leave a sentence that only makes sense if you also read the Japanese.

Voice: MaSU speaking directly to members. Warm, plain, first-person, short sentences. Never corporate marketing English ("Dear valued member", "We are pleased to announce", "Don't miss out!"). Do not add exclamation marks the Japanese doesn't have.

Structure rules:
- Preserve the layout exactly: every line break, every blank line, the order of paragraphs, and list markers (・, 1., ✓, emoji) as they appear.
- Never alter a URL. Copy it character for character, on the same line, with no shortening, no link text, no trailing punctuation added.
- Plain text only. The email renders raw text, so never use Markdown (#, *, -, **, backticks).
- Do not add, drop, merge, summarize, or reorder content. No translator's notes, no extra greeting or sign-off.

Wording rules (match the app's own English UI):
- Keep as-is: FOMUS, FOMUS GUILD, KACHIU, KUMIKI, Fuefuki, Yamanashi, Isawa Onsen.
- 枡 → MASU (uppercase). Explain it as "a square wooden cup" only where the Japanese itself explains it.
- ポイント → points / pt. 枡ポイント → MASU Points. ランク → rank. クエスト → quests. ハブ → MASU Hubs.
- ログインボーナス → Login Bonus. 招待コード → invite code. メンバーシップカード → membership card.
- 有料会員 → paid members. 無料会員 → free members. ギルドメンバー → guild members.
- Personal names: romanize naturally and keep -san (辻さん → Tsuji-san). Places keep their common romanization.
- Dates and times: write them the English way and keep the weekday if present (2026年7月1日(火) 19:00 → Tuesday, July 1, 2026, 7:00 PM). If the event is in Japan or the Japanese says 日本時間, append " (JST)".
- Money: keep the currency as written (980円 → ¥980, $10 → $10). Never convert between currencies.

Subject line: translate it as a subject line — concise, no ending period, no "Newsletter:" prefix, and no longer than the Japanese in spirit. Do not add "[FOMUS GUILD]"; the mailer adds it.

Return the translated subject on the first line, then a line containing only <<<BODY>>>, then the translated body. Output nothing else.`

export interface TranslatedNewsletter { subject_en: string; body_en: string }

const SEP = '<<<BODY>>>'

export async function translateNewsletter(input: { subject: string; body: string }): Promise<TranslatedNewsletter> {
  const client = new Anthropic()
  const stream = client.messages.stream({
    model: 'claude-sonnet-5',
    max_tokens: 16000,
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    output_config: { effort: 'medium' },
    messages: [{
      role: 'user',
      content: `SUBJECT:\n${input.subject}\n\nBODY:\n${input.body}`,
    }],
  })
  const message = await stream.finalMessage()
  if (message.stop_reason === 'refusal') throw new Error('translation refused')

  const text = message.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim()
  const sep = text.indexOf(SEP)
  if (sep < 0) throw new Error('unexpected translation format')
  const subject_en = text.slice(0, sep).trim().replace(/^SUBJECT:\s*/i, '').trim()
  const body_en = text.slice(sep + SEP.length).replace(/^\r?\n/, '').replace(/^BODY:\s*/i, '').trim()
  if (!subject_en || !body_en) throw new Error('empty translation')
  return { subject_en, body_en }
}
