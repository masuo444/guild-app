import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { otpVerifyLimiter } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'メールアドレスとOTPが必要です' },
        { status: 400 }
      )
    }

    // Rate limit by email
    if (!otpVerifyLimiter.check(email.toLowerCase())) {
      return NextResponse.json(
        { error: 'リクエストが多すぎます。しばらくしてからお試しください' },
        { status: 429 }
      )
    }

    const cookieStore = await cookies()

    // レスポンスを作成してCookieを設定できるようにする
    const response = NextResponse.json({ success: true })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    // SupabaseのOTP検証を使用
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })

    if (error) {
      console.error('Verify OTP error:', error)
      return NextResponse.json(
        { error: 'コードが正しくありません' },
        { status: 400 }
      )
    }

    // 成功 - Cookieが設定されたレスポンスを返す
    return response

  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}
