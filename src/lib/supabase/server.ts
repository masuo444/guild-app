import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // SupabaseがCookieを破棄しようとしている場合（サインアウト・
              // セッション失効時など）は、30日延長で上書きせずそのまま
              // 反映する。一律30日で上書きするとサインアウトしてもセッションが
              // 復活してしまう。
              const isClearing =
                !value ||
                (options?.maxAge !== undefined && options.maxAge <= 0) ||
                (options?.expires !== undefined && new Date(options.expires).getTime() <= Date.now())

              cookieStore.set(
                name,
                value,
                isClearing
                  ? options
                  : {
                      ...options,
                      // セッション延長: 30日間Cookieを保持
                      maxAge: 60 * 60 * 24 * 30, // 30日間
                    }
              )
            })
          } catch {
            // Server Component からの呼び出し時は無視
          }
        },
      },
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
      },
    }
  )
}

export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    }
  )
}
