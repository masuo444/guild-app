import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'メールアドレスが必要です' },
        { status: 400 }
      )
    }

    // Service Role Key を使用してSupabase Admin Clientを作成
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // ユーザーが存在するか確認（profilesテーブルで検索）
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      // Return same response shape to prevent email enumeration
      return NextResponse.json({
        success: true,
        redirectUrl: null,
      })
    }

    // マジックリンクを生成（管理者APIを使用、メール送信なし）
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/auth/callback`,
      },
    })

    if (linkError || !linkData) {
      console.error('Generate link error:', linkError)
      // Return same response shape to prevent information leakage
      return NextResponse.json({
        success: true,
        redirectUrl: null,
      })
    }

    // リダイレクトURLを返す（クライアント側でリダイレクト）
    return NextResponse.json({
      success: true,
      redirectUrl: linkData.properties.action_link,
    })

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}
