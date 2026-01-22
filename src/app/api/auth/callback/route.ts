import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ADMIN_EMAILS } from '@/lib/access'
import { isFreeMembershipType, MembershipType } from '@/types/database'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const inviteCode = requestUrl.searchParams.get('invite_code')
  const next = requestUrl.searchParams.get('next') || requestUrl.searchParams.get('redirect') || '/app'
  const origin = requestUrl.origin

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  let authError = null

  // PKCE flow (token_hash)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'magiclink' | 'email',
    })
    authError = error
  }
  // Code exchange flow
  else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    authError = error
  }
  // No valid auth params
  else {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_params`)
  }

  if (!authError) {
    // 認証成功 - ユーザープロフィールを確認
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // プロフィールが存在するか確認
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, subscription_status')
        .eq('id', user.id)
        .single()

      // 管理者メールかどうかチェック
      const isAdmin = ADMIN_EMAILS.includes(user.email as typeof ADMIN_EMAILS[number])

      // プロフィールがない場合は新規作成
      if (!profile) {
        const membershipId = `FG${Date.now().toString(36).toUpperCase()}`

        // 招待コードがある場合は処理
        let invitedBy: string | null = null
        let membershipType: MembershipType = 'standard'
        let subscriptionStatus: 'active' | 'free' | 'free_tier' = 'free_tier'

        if (inviteCode) {
          // 招待コードを取得
          const { data: invite } = await supabase
            .from('invites')
            .select('id, invited_by, membership_type, used')
            .eq('code', inviteCode)
            .single()

          if (invite && !invite.used) {
            invitedBy = invite.invited_by
            membershipType = (invite.membership_type || 'standard') as MembershipType

            // 無料メンバータイプの場合はactiveに
            if (isFreeMembershipType(membershipType)) {
              subscriptionStatus = 'free'
            }

            // 招待コードを使用済みにマーク
            await supabase
              .from('invites')
              .update({
                used: true,
                used_by: user.id,
              })
              .eq('id', invite.id)
          }
        }

        // プロフィール作成
        await supabase.from('profiles').insert({
          id: user.id,
          display_name: user.email?.split('@')[0] || null,
          role: isAdmin ? 'admin' : 'member',
          membership_status: 'active',
          membership_type: isAdmin ? 'standard' : membershipType,
          membership_id: membershipId,
          subscription_status: isAdmin ? 'active' : subscriptionStatus,
          invited_by: invitedBy,
        })

        // スタンダード会員（有料）の場合は決済ページへリダイレクト
        if (!isAdmin && !isFreeMembershipType(membershipType)) {
          return NextResponse.redirect(`${origin}/auth/subscribe`)
        }
      } else if (isAdmin && profile.subscription_status !== 'active') {
        // 既存プロフィールで管理者の場合、ステータスを更新
        await supabase
          .from('profiles')
          .update({
            role: 'admin',
            subscription_status: 'active',
          })
          .eq('id', user.id)
      } else if (profile.subscription_status === 'free_tier') {
        // 既存ユーザーで未課金の場合は決済ページへ
        return NextResponse.redirect(`${origin}/auth/subscribe`)
      }
    }

    return NextResponse.redirect(`${origin}${next}`)
  }

  // Auth error occurred - redirect to login with error
  return NextResponse.redirect(`${origin}/auth/login?error=auth`)
}
