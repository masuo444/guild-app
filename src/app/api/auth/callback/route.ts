import { createServerClient } from '@supabase/ssr'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_EMAILS } from '@/lib/access'
import { isFreeMembershipType, MembershipType } from '@/types/database'
import { stripe } from '@/lib/stripe/server'

async function checkAutoQuests(
  supabase: SupabaseClient,
  userId: string,
  profileData: {
    display_name?: string | null
    home_country?: string | null
    home_city?: string | null
    avatar_url?: string | null
    show_location_on_map?: boolean | null
    lat?: number | null
    lng?: number | null
  }
) {
  // Check "プロフィールを完成させよう" quest
  const profileComplete =
    profileData.display_name &&
    profileData.home_country &&
    profileData.home_city &&
    profileData.avatar_url

  if (profileComplete) {
    const { data: profileQuest } = await supabase
      .from('guild_quests')
      .select('id, points_reward')
      .eq('is_auto', true)
      .eq('title', 'プロフィールを完成させよう')
      .eq('is_active', true)
      .single()

    if (profileQuest) {
      const { data: existing } = await supabase
        .from('quest_submissions')
        .select('id')
        .eq('quest_id', profileQuest.id)
        .eq('user_id', userId)
        .single()

      if (!existing) {
        await supabase.from('quest_submissions').insert({
          quest_id: profileQuest.id,
          user_id: userId,
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          comment: 'auto',
        })

        await supabase.from('activity_logs').insert({
          user_id: userId,
          type: 'Quest Reward',
          note: `Quest: ${profileQuest.id}`,
          points: profileQuest.points_reward,
        })
      }
    }
  }

  // Check "マップに自分を表示しよう" quest
  const mapVisible =
    profileData.show_location_on_map &&
    profileData.lat != null &&
    profileData.lng != null

  if (mapVisible) {
    const { data: mapQuest } = await supabase
      .from('guild_quests')
      .select('id, points_reward')
      .eq('is_auto', true)
      .eq('title', 'マップに自分を表示しよう')
      .eq('is_active', true)
      .single()

    if (mapQuest) {
      const { data: existing } = await supabase
        .from('quest_submissions')
        .select('id')
        .eq('quest_id', mapQuest.id)
        .eq('user_id', userId)
        .single()

      if (!existing) {
        await supabase.from('quest_submissions').insert({
          quest_id: mapQuest.id,
          user_id: userId,
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          comment: 'auto',
        })

        await supabase.from('activity_logs').insert({
          user_id: userId,
          type: 'Quest Reward',
          note: `Quest: ${mapQuest.id}`,
          points: mapQuest.points_reward,
        })
      }
    }
  }
}

export async function GET(request: NextRequest) {
  // Service Role クライアント（RLS回避用）- ランタイムで作成
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  let inviteCode = requestUrl.searchParams.get('invite_code')
  const rawNext = requestUrl.searchParams.get('next') || requestUrl.searchParams.get('redirect') || '/app'
  const origin = requestUrl.origin

  // Validate redirect path: must be a relative path starting with / and not //
  const next = (rawNext.startsWith('/') && !rawNext.startsWith('//')) ? rawNext : '/app'

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
  // Already authenticated (client-side OTP verification済み) - cookieからセッションを確認
  else {
    const { data: { user: existingUser } } = await supabase.auth.getUser()
    if (!existingUser) {
      return NextResponse.redirect(`${origin}/auth/login?error=missing_params`)
    }
    // 既にクライアント側で認証済み - そのまま続行
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
    .select('id, subscription_status, display_name, home_country, home_city, avatar_url, show_location_on_map, lat, lng')
    .eq('id', user.id)
    .single()

  // 管理者メールかどうかチェック
  const isAdmin = ADMIN_EMAILS.includes(user.email as typeof ADMIN_EMAILS[number])

  // プロフィールが存在しないか、招待コード付きの新規登録フローかを判定
  // DBトリガーが先にプロフィールを作成する場合があるため、招待コードがあれば常に更新する
  // ただし、既にactive（有料決済済み）のユーザーは除外
  const needsSetup = !profile || (!!inviteCode && profile.subscription_status !== 'active')

  if (needsSetup) {
    const membershipId = profile?.id ? undefined : `FG${Date.now().toString(36).toUpperCase()}`

    // 招待コードがある場合は処理
    let invitedBy: string | null = null
    let membershipType: MembershipType = 'standard'
    let subscriptionStatus: 'active' | 'free' | 'free_tier' = 'free_tier'
    let stripeCustomerId: string | null = null
    let stripeSubscriptionId: string | null = null
    let targetName: string | null = null
    let targetCountry: string | null = null
    let targetCity: string | null = null
    let targetLat: number | null = null
    let targetLng: number | null = null

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
      console.log('Processing invite code:', inviteCode)
      // 招待コードを取得（Service Roleで確実に取得）
      const { data: invite, error: inviteError } = await supabaseAdmin
        .from('invites')
        .select('id, invited_by, membership_type, used, reusable, use_count, target_name, target_country, target_city, target_lat, target_lng')
        .eq('code', inviteCode)
        .single()

      if (inviteError) {
        console.error('Failed to fetch invite:', inviteError)
      }

      console.log('Invite data:', invite)

      // reusable の場合は used フラグを無視
      const isInviteValid = invite && (invite.reusable ? true : !invite.used)

      if (isInviteValid) {
        invitedBy = invite.invited_by
        membershipType = (invite.membership_type || 'standard') as MembershipType
        targetName = invite.target_name || null
        targetCountry = invite.target_country || null
        targetCity = invite.target_city || null
        targetLat = invite.target_lat ?? null
        targetLng = invite.target_lng ?? null
        console.log('Setting membershipType from invite:', membershipType)

        // 無料メンバータイプの場合はfreeに
        if (isFreeMembershipType(membershipType)) {
          subscriptionStatus = 'free'
        }
        // 有料メンバーでStripe決済済みでない場合はfree_tierに
        else if (!stripeSessionId) {
          subscriptionStatus = 'free_tier'
        }

        // 招待コードの使用を記録
        if (invite.reusable) {
          // 再利用可能な招待：use_count をインクリメント（used は変更しない）
          const { error: updateInviteError } = await supabaseAdmin
            .from('invites')
            .update({
              use_count: (invite.use_count || 0) + 1,
            })
            .eq('id', invite.id)

          if (updateInviteError) {
            console.error('Failed to update invite use_count:', updateInviteError)
          }
        } else {
          // 通常の招待：used = true に設定
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

          // 招待クエスト自動達成（無料メンバーのみ。有料はStripe webhookで処理）
          if (isFreeMembershipType(membershipType)) {
            const { data: inviteQuest } = await supabaseAdmin
              .from('guild_quests')
              .select('id, points_reward')
              .eq('is_auto', true)
              .eq('title', '友達をGuildに招待しよう')
              .eq('is_active', true)
              .single()

            if (inviteQuest) {
              const { data: existingSub } = await supabaseAdmin
                .from('quest_submissions')
                .select('id')
                .eq('quest_id', inviteQuest.id)
                .eq('user_id', invitedBy)
                .eq('comment', user.id)
                .single()

              if (!existingSub) {
                await supabaseAdmin.from('quest_submissions').insert({
                  quest_id: inviteQuest.id,
                  user_id: invitedBy,
                  status: 'approved',
                  reviewed_at: new Date().toISOString(),
                  comment: user.id,
                })
                await supabaseAdmin.from('activity_logs').insert({
                  user_id: invitedBy,
                  type: 'Quest Reward',
                  note: `Quest: ${inviteQuest.id}:${user.id}`,
                  points: inviteQuest.points_reward,
                })
              }
            }
          }
        }
      }
    }

    // プロフィール作成または更新（Service Roleで確実に実行）
    const showOnMap = true
    const profileUpdateData = {
      display_name: targetName || user.email?.split('@')[0] || null,
      role: isAdmin ? 'admin' : 'member',
      membership_status: 'active',
      membership_type: isAdmin ? 'standard' : membershipType,
      subscription_status: isAdmin ? 'active' : subscriptionStatus,
      invited_by: invitedBy,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      show_location_on_map: showOnMap,
      home_country: targetCountry,
      home_city: targetCity,
      lat: targetLat,
      lng: targetLng,
    }

    if (profile) {
      // トリガーで作成された不完全プロフィールを更新
      console.log('Updating incomplete profile with data:', profileUpdateData)
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          ...profileUpdateData,
          ...(membershipId ? { membership_id: membershipId } : {}),
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Failed to update profile:', updateError)
      }
    } else {
      // プロフィールが存在しない場合は新規作成
      const newMembershipId = `FG${Date.now().toString(36).toUpperCase()}`
      const profileData = {
        id: user.id,
        ...profileUpdateData,
        membership_id: newMembershipId,
      }
      console.log('Creating profile with data:', profileData)
      const { error: profileError } = await supabaseAdmin.from('profiles').insert(profileData)

      if (profileError) {
        console.error('Failed to create profile:', profileError)
        // プロフィール作成失敗はクリティカル - エラーページにリダイレクト
        return NextResponse.redirect(`${origin}/auth/login?error=profile_creation_failed`)
      }
    }

    // 新規ユーザーに100ポイント（Welcome Bonus）を付与（Service Roleで確実に挿入）
    // 既にWelcome Bonusがあるかチェック（重複防止）
    const { data: existingWelcome } = await supabaseAdmin
      .from('activity_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'Welcome Bonus')
      .single()

    if (!existingWelcome) {
      const { error: welcomeBonusError } = await supabaseAdmin.from('activity_logs').insert({
        user_id: user.id,
        type: 'Welcome Bonus',
        note: 'ギルドへようこそ！',
        points: 100,
      })

      if (welcomeBonusError) {
        console.error('Failed to insert welcome bonus:', welcomeBonusError)
      }
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
  } else if (profile.subscription_status === 'free_tier' || profile.subscription_status === 'inactive') {
    // 既存ユーザーで未課金の場合は決済ページへ
    redirectTo = `${origin}/auth/subscribe`
  }

  // 既存ユーザーのログイン時に自動クエスト達成チェック
  if (profile) {
    try {
      await checkAutoQuests(supabaseAdmin, user.id, {
        display_name: profile.display_name,
        home_country: profile.home_country,
        home_city: profile.home_city,
        avatar_url: profile.avatar_url,
        show_location_on_map: profile.show_location_on_map,
        lat: profile.lat,
        lng: profile.lng,
      })
    } catch (e) {
      console.error('Auto-quest check error:', e)
    }
  }

  // 最終的なリダイレクト先でレスポンスを再作成（Cookieを保持）
  const finalResponse = NextResponse.redirect(redirectTo, { status: 302 })

  // 元のレスポンスからCookieをコピー（オプションも保持）
  response.cookies.getAll().forEach(cookie => {
    finalResponse.cookies.set(cookie.name, cookie.value, {
      path: cookie.path || '/',
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite as 'lax' | 'strict' | 'none' | undefined,
      maxAge: cookie.maxAge,
    })
  })

  return finalResponse
}
