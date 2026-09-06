import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { otpSendLimiter } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'メールアドレスが必要です' },
        { status: 400 }
      )
    }

    // Rate limit by email
    if (!otpSendLimiter.check(email.toLowerCase())) {
      return NextResponse.json(
        { error: 'リクエストが多すぎます。しばらくしてからお試しください' },
        { status: 429 }
      )
    }

    // Service Role Key を使用してSupabase Admin Clientを作成
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // auth.usersでユーザー存在確認
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers()

    // バックエンド(Supabase)に到達できない場合は「送信しました」と偽らず、明示的に伝える
    // （プロジェクト一時停止・DNS障害などで listUsers が失敗するケース）
    if (userError) {
      console.error('send-otp: listUsers failed', userError)
      return NextResponse.json(
        { error: 'サーバーに接続できません。しばらくしてからもう一度お試しください。 / Cannot reach the server. Please try again later.', unavailable: true },
        { status: 503 }
      )
    }

    const userExists = users.some(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!userExists) {
      return NextResponse.json({ success: true })
    }

    // Supabaseの組み込みOTPを使用してメール送信
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {},
        },
      }
    )

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    })

    if (otpError) {
      // レート制限エラーの場合は直接ログインにフォールバック
      if (otpError.message.includes('rate limit') || otpError.message.includes('Rate limit')) {
        return NextResponse.json(
          { rateLimited: true },
          { status: 200 }
        )
      }
      console.error('OTP error:', otpError)
      if (otpError.message.includes('fetch failed') || otpError.status === 0) {
        return NextResponse.json(
          { error: 'サーバーに接続できません。しばらくしてからもう一度お試しください。 / Cannot reach the server. Please try again later.', unavailable: true },
          { status: 503 }
        )
      }
      // Return generic success to prevent information leakage
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}
