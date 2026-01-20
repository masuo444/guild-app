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

  // /app 以下は一時的に認証不要（開発中）
  // if (pathname.startsWith('/app')) {
  //   if (!user) {
  //     const redirectUrl = new URL('/auth/login', request.url)
  //     redirectUrl.searchParams.set('redirect', pathname)
  //     return NextResponse.redirect(redirectUrl)
  //   }
  // }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
