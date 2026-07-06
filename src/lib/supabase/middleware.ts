import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            // SupabaseがCookieを破棄しようとしている場合（サインアウト・
            // セッション失効時など。値が空 or 過去日付での失効指定）は、
            // 30日延長で上書きせずそのまま反映する。ここを一律30日で
            // 上書きすると、サインアウトしてもセッションが復活してしまう。
            const isClearing =
              !value ||
              (options?.maxAge !== undefined && options.maxAge <= 0) ||
              (options?.expires !== undefined && new Date(options.expires).getTime() <= Date.now())

            supabaseResponse.cookies.set(
              name,
              value,
              isClearing
                ? options
                : {
                    ...options,
                    // セッション延長: 30日間Cookieを保持
                    // ブラウザを閉じてもセッションを維持
                    maxAge: 60 * 60 * 24 * 30, // 30日間
                  }
            )
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabaseResponse, user, supabase }
}
