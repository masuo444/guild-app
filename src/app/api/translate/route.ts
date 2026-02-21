import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_LANGUAGES = ['ja', 'en']

export async function POST(request: NextRequest) {
  try {
    // 認証チェック（ログインユーザーのみ）
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { text, from = 'ja', to = 'en' } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // テキスト長制限
    if (text.length > 5000) {
      return NextResponse.json({ error: 'Text too long (max 5000 characters)' }, { status: 400 })
    }

    // 言語パラメータのホワイトリスト
    if (!ALLOWED_LANGUAGES.includes(from) || !ALLOWED_LANGUAGES.includes(to)) {
      return NextResponse.json({ error: 'Invalid language parameter' }, { status: 400 })
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
