import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_EMAILS } from '@/lib/access'
import { isFreeMembershipType, MembershipType } from '@/types/database'
import { getInviteMaxUses } from '@/lib/utils'

/**
 * レート制限時のフォールバック: メール送信なしで招待登録を完了する
 * 1. Admin API でユーザーを作成（存在しない場合）
 * 2. プロフィール作成 + 招待コード使用記録
 * 3. Magic link トークンを生成して callback URL を返す
 */
export async function POST(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  let body: { email: string; inviteCode: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { email, inviteCode } = body

  if (!email || !inviteCode) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // 招待コードを検証
  const { data: invite, error: inviteError } = await supabaseAdmin
    .from('invites')
    .select('id, invited_by, membership_type, used, reusable, use_count, target_name, target_country, target_city, target_lat, target_lng')
    .eq('code', inviteCode)
    .single()

  if (inviteError || !invite) {
    return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 })
  }

  let isValid = !invite.used
  if (invite.reusable) {
    const { data: allInvites } = await supabaseAdmin
      .from('invites')
      .select('use_count')
      .eq('invited_by', invite.invited_by)
      .eq('reusable', true)
    const totalInvites = allInvites?.reduce((sum, inv) => sum + (inv.use_count || 0), 0) || 0
    const maxUses = getInviteMaxUses(totalInvites)
    isValid = (invite.use_count || 0) < maxUses
  }
  if (!isValid) {
    return NextResponse.json({ error: 'Invite code already used' }, { status: 400 })
  }

  const membershipType = (invite.membership_type || 'standard') as MembershipType

  // 無料タイプのみ処理（有料はStripeフロー経由）
  if (!isFreeMembershipType(membershipType)) {
    return NextResponse.json({ error: 'This endpoint is for free invitations only' }, { status: 400 })
  }

  // ユーザーを取得または作成
  let userId: string
  let isNewUser = false

  // まずcreateUserを試みる（既存ユーザーなら重複エラーが返る）
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { invite_code: inviteCode },
  })

  if (createError) {
    if (createError.message.includes('already been registered') || createError.message.includes('already exists')) {
      // 既存ユーザー → メールで検索
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
      const existingUser = userList?.users?.find(u => u.email === email)
      if (!existingUser) {
        return NextResponse.json({ error: 'User lookup failed' }, { status: 500 })
      }
      userId = existingUser.id
    } else {
      console.error('Failed to create user:', createError)
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }
  } else if (newUser?.user) {
    userId = newUser.user.id
    isNewUser = true
    // トリガーによるプロフィール作成の完了を待つ
    await new Promise(resolve => setTimeout(resolve, 300))
  } else {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }

  const isAdmin = ADMIN_EMAILS.includes(email as typeof ADMIN_EMAILS[number])
  const membershipId = `FG${Date.now().toString(36).toUpperCase()}`

  const profileData = {
    display_name: invite.target_name || email.split('@')[0] || null,
    role: isAdmin ? 'admin' as const : 'member' as const,
    membership_status: 'active',
    membership_type: isAdmin ? 'standard' : membershipType,
    membership_id: membershipId,
    subscription_status: isAdmin ? 'active' : 'free',
    invited_by: invite.invited_by,
    show_location_on_map: true,
    home_country: invite.target_country || null,
    home_city: invite.target_city || null,
    lat: invite.target_lat ?? null,
    lng: invite.target_lng ?? null,
  }

  // プロフィールが既に存在するかチェック（トリガーで作成された可能性あり）
  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('id, subscription_status')
    .eq('id', userId)
    .single()

  if (existingProfile) {
    // トリガーで作成された不完全なプロフィールを正しい値に更新
    // 既に 'active'（有料決済済み）なら上書きしない
    if (existingProfile.subscription_status !== 'active') {
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(profileData)
        .eq('id', userId)

      if (updateError) {
        console.error('Failed to update profile:', updateError)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
      }
    }
  } else {
    // プロフィールが存在しない場合は新規作成
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      ...profileData,
    })

    if (profileError) {
      console.error('Failed to create profile:', profileError)
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }
  }

  if (isNewUser) {
    // Welcome Bonus 重複チェック（リトライ対策）
    const { data: existingWelcome } = await supabaseAdmin
      .from('activity_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'Welcome Bonus')
      .single()

    if (!existingWelcome) {
      // Welcome Bonus (100pt)
      await supabaseAdmin.from('activity_logs').insert({
        user_id: userId,
        type: 'Welcome Bonus',
        note: 'ギルドへようこそ！',
        points: 100,
      })

      // 招待者に Invite Bonus (100pt)
      if (invite.invited_by) {
        await supabaseAdmin.from('activity_logs').insert({
          user_id: invite.invited_by,
          type: 'Invite Bonus',
          note: '新メンバーを招待しました',
          points: 100,
        })

        // 招待クエスト自動達成（リピータブル：招待するたびにポイント付与）
        const { data: inviteQuest } = await supabaseAdmin
          .from('guild_quests')
          .select('id, points_reward')
          .eq('is_auto', true)
          .eq('title', '友達をGuildに招待しよう')
          .eq('is_active', true)
          .single()

        if (inviteQuest) {
          // 重複チェック（同じ被招待者で既に達成済みか）
          const { data: existing } = await supabaseAdmin
            .from('quest_submissions')
            .select('id')
            .eq('quest_id', inviteQuest.id)
            .eq('user_id', invite.invited_by)
            .eq('comment', userId)
            .single()

          if (!existing) {
            await supabaseAdmin.from('quest_submissions').insert({
              quest_id: inviteQuest.id,
              user_id: invite.invited_by,
              status: 'approved',
              reviewed_at: new Date().toISOString(),
              comment: userId,
            })
            await supabaseAdmin.from('activity_logs').insert({
              user_id: invite.invited_by,
              type: 'Quest Reward',
              note: `Quest: ${inviteQuest.id}:${userId}`,
              points: inviteQuest.points_reward,
            })
          }
        }
      }
    }

    // 招待コード使用記録
    if (invite.reusable) {
      await supabaseAdmin
        .from('invites')
        .update({ use_count: (invite.use_count || 0) + 1 })
        .eq('id', invite.id)
    } else {
      await supabaseAdmin
        .from('invites')
        .update({ used: true, used_by: userId })
        .eq('id', invite.id)
    }
  }

  // Magic link を生成して hashed_token を取得（レート制限なし）
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (linkError || !linkData) {
    console.error('Failed to generate magic link:', linkError)
    return NextResponse.json({ error: 'Failed to generate login link' }, { status: 500 })
  }

  // hashed_token を使って callback URL を構築
  const callbackUrl = `/api/auth/callback?token_hash=${linkData.properties.hashed_token}&type=magiclink&next=/app`

  return NextResponse.json({ callbackUrl })
}
