import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_EMAILS } from '@/lib/access'
import { isFreeMembershipType, MembershipType } from '@/types/database'
import { stripe } from '@/lib/stripe/server'

// Service Role クライアント（RLS回避用）
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  let inviteCode = requestUrl.searchParams.get('invite_code')
  const next = requestUrl.searchParams.get('next') || requestUrl.searchParams.get('redirect') || '/app'
  const origin = requestUrl.origin

  const cookieStore = await cookies()

  // URLに招待コードがない場合、cookieから取得
  if (!inviteCode) {
    const pendingInviteCode = cookieStore.get('pending_invite_code')?.value
    if (pendingInviteCode) {
      inviteCode = pendingInviteCode
    }
  }

  // Stripe session IDをcookieから取得
  const stripeSessionId = cookieStore.get('stripe_session_id')?.value

  // リダイレクト先を決定するための変数
  let redirectTo = `${origin}${next}`

  // レスポンスを先に作成（後でリダイレクト先を変更する場合に備えてnextで初期化）
  let response = NextResponse.redirect(redirectTo, { status: 302 })

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
            response.cookies.set(name, value, options)
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

  if (authError) {
    console.error('Auth error:', authError)
    return NextResponse.redirect(`${origin}/auth/login?error=auth`)
  }

  // 認証成功 - ユーザープロフィールを確認
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_user`)
  }

  // Cookie cleanup
  response.cookies.delete('pending_invite_code')
  response.cookies.delete('stripe_session_id')

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
    let stripeCustomerId: string | null = null
    let stripeSubscriptionId: string | null = null

    // Stripe session があれば検証して情報を取得
    if (stripeSessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(stripeSessionId)
        if (session.payment_status === 'paid') {
          subscriptionStatus = 'active'
          stripeCustomerId = session.customer as string
          stripeSubscriptionId = session.subscription as string

          // Subscriptionにuser_idを追加（将来のwebhook用）
          if (stripeSubscriptionId) {
            await stripe.subscriptions.update(stripeSubscriptionId, {
              metadata: { supabase_user_id: user.id }
            })
          }
        }
      } catch {
        // Stripe session取得エラーは無視（ログインは継続）
      }
    }

    if (inviteCode) {
      // 招待コードを取得（Service Roleで確実に取得）
      const { data: invite, error: inviteError } = await supabaseAdmin
        .from('invites')
        .select('id, invited_by, membership_type, used')
        .eq('code', inviteCode)
        .single()

      if (inviteError) {
        console.error('Failed to fetch invite:', inviteError)
      }

      if (invite && !invite.used) {
        invitedBy = invite.invited_by
        membershipType = (invite.membership_type || 'standard') as MembershipType

        // 無料メンバータイプの場合はfreeに
        if (isFreeMembershipType(membershipType)) {
          subscriptionStatus = 'free'
        }
        // 有料メンバーでStripe決済済みでない場合はfree_tierに
        else if (!stripeSessionId) {
          subscriptionStatus = 'free_tier'
        }

        // 招待コードを使用済みにマーク（Service Roleで確実に更新）
        const { error: updateInviteError } = await supabaseAdmin
          .from('invites')
          .update({
            used: true,
            used_by: user.id,
          })
          .eq('id', invite.id)

        if (updateInviteError) {
          console.error('Failed to update invite:', updateInviteError)
        }

        // 招待者に100ポイント（Invite Bonus）を付与（Service Roleで確実に挿入）
        if (invitedBy) {
          const { error: inviteBonusError } = await supabaseAdmin.from('activity_logs').insert({
            user_id: invitedBy,
            type: 'Invite Bonus',
            note: '新メンバーを招待しました',
            points: 100,
          })
          if (inviteBonusError) {
            console.error('Failed to insert invite bonus:', inviteBonusError)
          }
        }
      }
    }

    // プロフィール作成（Service Roleで確実に挿入）
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: user.id,
      display_name: user.email?.split('@')[0] || null,
      role: isAdmin ? 'admin' : 'member',
      membership_status: 'active',
      membership_type: isAdmin ? 'standard' : membershipType,
      membership_id: membershipId,
      subscription_status: isAdmin ? 'active' : subscriptionStatus,
      invited_by: invitedBy,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
    })

    if (profileError) {
      console.error('Failed to create profile:', profileError)
      // プロフィール作成失敗はクリティカル - エラーページにリダイレクト
      return NextResponse.redirect(`${origin}/auth/login?error=profile_creation_failed`)
    }

    // 新規ユーザーに100ポイント（Welcome Bonus）を付与（Service Roleで確実に挿入）
    const { error: welcomeBonusError } = await supabaseAdmin.from('activity_logs').insert({
      user_id: user.id,
      type: 'Welcome Bonus',
      note: 'ギルドへようこそ！',
      points: 100,
    })

    if (welcomeBonusError) {
      console.error('Failed to insert welcome bonus:', welcomeBonusError)
    }

    // スタンダード会員（有料）で未決済の場合は決済ページへリダイレクト
    if (!isAdmin && !isFreeMembershipType(membershipType) && !stripeSessionId) {
      redirectTo = `${origin}/auth/subscribe`
    }
  } else if (isAdmin && profile.subscription_status !== 'active') {
    // 既存プロフィールで管理者の場合、ステータスを更新（Service Roleで確実に更新）
    const { error: adminUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: 'admin',
        subscription_status: 'active',
      })
      .eq('id', user.id)

    if (adminUpdateError) {
      console.error('Failed to update admin profile:', adminUpdateError)
    }
  } else if (profile.subscription_status === 'free_tier') {
    // 既存ユーザーで未課金の場合は決済ページへ
    redirectTo = `${origin}/auth/subscribe`
  }

  // 最終的なリダイレクト先でレスポンスを再作成（Cookieを保持）
  const finalResponse = NextResponse.redirect(redirectTo, { status: 302 })

  // 元のレスポンスからCookieをコピー
  response.cookies.getAll().forEach(cookie => {
    finalResponse.cookies.set(cookie.name, cookie.value)
  })

  return finalResponse
}
