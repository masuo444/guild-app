import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request)
  const pathname = request.nextUrl.pathname

  // 公開ページはスキップ
  if (
    pathname === '/' ||
    pathname.startsWith('/invite') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/demo') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return supabaseResponse
  }

  // /app 以下は認証＆アクティブ会員のみ
  if (pathname.startsWith('/app')) {
    // 未ログインの場合はログインページへ
    if (!user) {
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // デバッグユーザーはスキップ（テスト用）
    if (user.email === 'keisukendo414@gmail.com') {
      return supabaseResponse
    }

    // プロファイルをチェック
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, membership_status')
      .eq('id', user.id)
      .single()

    // サブスクリプションがアクティブまたは無料でない場合
    if (!profile || (profile.subscription_status !== 'active' && profile.subscription_status !== 'free')) {
      return NextResponse.redirect(new URL('/auth/subscribe', request.url))
    }

    // メンバーシップがアクティブでない場合
    if (profile.membership_status !== 'active') {
      return NextResponse.redirect(new URL('/auth/pending', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
