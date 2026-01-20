import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// 管理者メールアドレス
const ADMIN_EMAILS = ['keisukendo414@gmail.com']

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/auth/subscribe'

  const supabase = await createClient()

  // token_hash による認証（デバッグログイン用）
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'magiclink' | 'email',
    })

    if (!error) {
      // デバッグログインの場合は直接 /app へ
      return NextResponse.redirect(`${origin}/app`)
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // セッション確立後、ユーザー情報を取得
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // 管理者メールの場合は直接 /app へ
        if (ADMIN_EMAILS.includes(user.email || '')) {
          return NextResponse.redirect(`${origin}/app`)
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status, membership_status')
          .eq('id', user.id)
          .single()

        // サブスクリプションがアクティブまたは無料なら /app へ
        if (
          (profile?.subscription_status === 'active' || profile?.subscription_status === 'free') &&
          profile?.membership_status === 'active'
        ) {
          return NextResponse.redirect(`${origin}/app`)
        }
      }

      // 初回ログインまたは未決済の場合はサブスクリプションページへ
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // エラー時はログインページへ
  return NextResponse.redirect(`${origin}/auth/login?error=auth`)
}
