/**
 * JA→EN 翻訳ヘルパー（サーバー用）。
 * 既存の /api/translate と同じ Google の gtx エンドポイントを使う。
 * 1リクエスト5000字制限があるため、段落単位でチャンク分割する。
 */
async function translateChunk(text: string, from = 'ja', to = 'en'): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Translation API failed')
  const data = await res.json()
  return (data[0]?.map((seg: [string]) => seg[0]).join('') || text)
}

export async function translateJaToEn(text: string): Promise<string> {
  if (!text.trim()) return ''
  const LIMIT = 4500
  // 段落（空行）で分割し、各チャンクを LIMIT 以下にまとめる
  const paragraphs = text.split(/\n\n+/)
  const chunks: string[] = []
  let cur = ''
  for (const p of paragraphs) {
    if ((cur + '\n\n' + p).length > LIMIT && cur) {
      chunks.push(cur)
      cur = p
    } else {
      cur = cur ? cur + '\n\n' + p : p
    }
  }
  if (cur) chunks.push(cur)

  const out: string[] = []
  for (const c of chunks) {
    // さらに単一段落が長すぎる場合はそのまま（gtx側で処理）
    out.push(await translateChunk(c.slice(0, 5000)))
  }
  return out.join('\n\n')
}
