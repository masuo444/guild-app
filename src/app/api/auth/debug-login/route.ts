import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// デバッグ用ログイン（テスト環境のみ）
export async function POST() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // テストユーザーのメールアドレス
    const testEmail = 'keisukendo414@gmail.com'

    // ユーザーを取得
    const { data: userData } = await supabaseAdmin.auth.admin.listUsers()
    const testUser = userData?.users?.find(u => u.email === testEmail)

    if (testUser) {
      // プロフィールを強制的にactiveに設定
      await supabaseAdmin
        .from('profiles')
        .update({
          subscription_status: 'active',
          membership_status: 'active',
          role: 'admin'
        })
        .eq('id', testUser.id)
    }

    // Magic Link を生成（OTP）
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: testEmail,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/app`,
      },
    })

    if (error) {
      console.error('Debug login error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 生成されたリンクのトークンを抽出してリダイレクトURLを返す
    if (data?.properties?.hashed_token) {
      const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?token_hash=${data.properties.hashed_token}&type=magiclink&next=/app`
      return NextResponse.json({ url: redirectUrl })
    }

    return NextResponse.json({ error: 'Failed to generate link' }, { status: 500 })
  } catch (error) {
    console.error('Debug login error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
