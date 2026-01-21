import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // スーパー管理者メールアドレスのみ許可
    if (!SUPER_ADMIN_EMAIL || email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'このメールアドレスでは直接ログインできません' },
        { status: 403 }
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

    // ユーザーを取得または作成
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      console.error('List users error:', listError)
      return NextResponse.json(
        { error: 'ユーザー情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    let user = users.users.find(u => u.email === email)

    if (!user) {
      // ユーザーが存在しない場合は作成（メール確認済みとして）
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
      })

      if (createError) {
        console.error('Create user error:', createError)
        return NextResponse.json(
          { error: 'ユーザーの作成に失敗しました' },
          { status: 500 }
        )
      }

      user = newUser.user
    }

    // マジックリンクを生成（管理者APIを使用）
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
