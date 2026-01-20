import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  const supabase = await createClient()

  // token_hash による認証（デバッグログイン用）
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'magiclink' | 'email',
    })

    if (!error) {
      return NextResponse.redirect(`${origin}/app`)
    }
  }

  // OAuth (Google) または Magic Link のコード交換
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // 認証成功 → 直接 /app へ（Stripe決済は一時的にスキップ）
      return NextResponse.redirect(`${origin}/app`)
    }
  }

  // エラー時はログインページへ
  return NextResponse.redirect(`${origin}/auth/login?error=auth`)
}
