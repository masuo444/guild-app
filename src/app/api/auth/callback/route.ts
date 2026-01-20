import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const error_description = searchParams.get('error_description')

  // OAuth エラーの場合
  if (error_description) {
    console.error('OAuth error:', error_description)
    return NextResponse.redirect(`${origin}/auth/login?error=oauth&message=${encodeURIComponent(error_description)}`)
  }

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
    console.error('OTP verification error:', error)
  }

  // OAuth (Google) または Magic Link のコード交換
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      // 認証成功 → 直接 /app へ（Stripe決済は一時的にスキップ）
      return NextResponse.redirect(`${origin}/app`)
    }
    console.error('Code exchange error:', error)
  }

  // コードがない場合（直接アクセス）
  if (!code && !tokenHash) {
    return NextResponse.redirect(`${origin}/auth/login`)
  }

  // エラー時はログインページへ
  return NextResponse.redirect(`${origin}/auth/login?error=auth`)
}
