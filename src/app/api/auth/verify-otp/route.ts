import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'メールアドレスとOTPが必要です' },
        { status: 400 }
      )
    }

    // Service Role Key を使用してSupabase Admin Clientを作成
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ユーザーを取得
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      console.error('List users error:', listError)
      return NextResponse.json(
        { error: 'ユーザー情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    const user = users.users.find(u => u.email === email)

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    // プロフィールからOTPを取得して検証
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('otp_code, otp_expires_at')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'プロフィールの取得に失敗しました' },
        { status: 500 }
      )
    }

    // OTP検証
    if (!profile.otp_code || profile.otp_code !== otp) {
      return NextResponse.json(
        { error: '認証コードが正しくありません' },
        { status: 400 }
      )
    }

    // 有効期限チェック
    if (profile.otp_expires_at && new Date(profile.otp_expires_at) < new Date()) {
      return NextResponse.json(
        { error: '認証コードの有効期限が切れています' },
        { status: 400 }
      )
    }

    // OTPをクリア
    await supabaseAdmin
      .from('profiles')
      .update({
        otp_code: null,
        otp_expires_at: null,
      })
      .eq('id', user.id)

    // マジックリンクを生成してログイン
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/auth/callback`,
      },
    })

    if (linkError || !linkData) {
      console.error('Generate link error:', linkError)
      return NextResponse.json(
        { error: 'ログインリンクの生成に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      redirectUrl: linkData.properties.action_link,
    })

  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}
