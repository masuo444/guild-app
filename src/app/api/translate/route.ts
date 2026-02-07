import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { text, from = 'ja', to = 'en' } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`

    const res = await fetch(url)
    if (!res.ok) {
      throw new Error('Translation API failed')
    }

    const data = await res.json()

    // Google Translate returns nested arrays: [[["translated text","original text",...],...],...]
    const translated = data[0]
      ?.map((segment: [string]) => segment[0])
      .join('') || text

    return NextResponse.json({ translated })
  } catch {
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 })
  }
}
