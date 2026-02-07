import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_EMAILS } from '@/lib/access'
import { isFreeMembershipType, MembershipType } from '@/types/database'

export async function POST(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let body: { userId: string; email: string; inviteCode: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { userId, email, inviteCode } = body

  if (!userId || !email || !inviteCode) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // 招待コードを検証
  const { data: invite, error: inviteError } = await supabaseAdmin
    .from('invites')
    .select('id, invited_by, membership_type, used, reusable, use_count, target_name, target_country, target_city')
    .eq('code', inviteCode)
    .single()

  if (inviteError || !invite) {
    return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 })
  }

  const isValid = invite.reusable ? true : !invite.used
  if (!isValid) {
    return NextResponse.json({ error: 'Invite code already used' }, { status: 400 })
  }

  const membershipType = (invite.membership_type || 'standard') as MembershipType

  // 無料タイプのみ処理（有料はStripeフロー経由）
  if (!isFreeMembershipType(membershipType)) {
    return NextResponse.json({ error: 'This endpoint is for free invitations only' }, { status: 400 })
  }

  // プロフィールが既に存在するかチェック
  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()

  if (!existingProfile) {
    // プロフィール作成
    const isAdmin = ADMIN_EMAILS.includes(email as typeof ADMIN_EMAILS[number])
    const membershipId = `FG${Date.now().toString(36).toUpperCase()}`

    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      display_name: invite.target_name || email.split('@')[0] || null,
      role: isAdmin ? 'admin' : 'member',
      membership_status: 'active',
      membership_type: isAdmin ? 'standard' : membershipType,
      membership_id: membershipId,
      subscription_status: isAdmin ? 'active' : 'free',
      invited_by: invite.invited_by,
      show_location_on_map: true,
      home_country: invite.target_country || null,
      home_city: invite.target_city || null,
    })

    if (profileError) {
      console.error('Failed to create profile:', profileError)
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }

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

  // Magic link を生成して hashed_token を取得
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
