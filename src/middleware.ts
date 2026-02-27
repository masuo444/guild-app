import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  // Server Componentsでpathname参照できるようにリクエストヘッダーにセット
  request.headers.set('x-pathname', pathname)
  const { supabaseResponse, user } = await updateSession(request)

  // ログイン済みユーザーが /auth/login にアクセスした場合、/app にリダイレクト
  if (pathname === '/auth/login' && user) {
    return NextResponse.redirect(new URL('/app', request.url))
  }

  // 公開ページはスキップ
  if (
    pathname === '/' ||
    pathname.startsWith('/guide') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/invite') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return supabaseResponse
  }

  // /app 以下は認証必須
  if (pathname.startsWith('/app')) {
    if (!user) {
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
