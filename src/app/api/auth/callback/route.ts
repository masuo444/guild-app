import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/auth/subscribe'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // セッション確立後、プロファイルのステータスをチェック
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status, membership_status')
          .eq('id', user.id)
          .single()

        // サブスクリプションがアクティブなら /app へ
        if (profile?.subscription_status === 'active' && profile?.membership_status === 'active') {
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
