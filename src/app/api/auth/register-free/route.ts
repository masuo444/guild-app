import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { ADMIN_EMAILS } from '@/lib/access'
import { notifyAdminNewMember } from '@/lib/notifications'

/**
 * 招待コードなしの「無料で参加」登録（半オープン化）。
 *
 * セキュリティ: このエンドポイントはOTP検証でセッションを確立済みの本人だけが
 * 呼べる。userId / email はクライアント入力ではなく必ずセッションから取得する。
 * ログイントークンは一切返さない（セッションは呼び出し時点で確立済み）。
 *
 * 作成される会員は subscription_status='free_tier'（無料登録）。
 * マップ等の有料機能は access.ts のゲートで制限される。
 */
export async function POST() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const supabaseSession = await createServerClient()
  const { data: { user } } = await supabaseSession.auth.getUser()

  if (!user || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = user.id
  const email = user.email

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const isAdmin = ADMIN_EMAILS.includes(email as typeof ADMIN_EMAILS[number])

  // 既存プロフィール確認（signup トリガーで作成済みのことが多い）
  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('id, subscription_status')
    .eq('id', userId)
    .single()

  // すでに有料(active)・特別会員(free)なら格下げしない
  if (existingProfile && (existingProfile.subscription_status === 'active' || existingProfile.subscription_status === 'free')) {
    return NextResponse.json({ success: true, alreadyMember: true })
  }

  const membershipId = `FG${Date.now().toString(36).toUpperCase()}`
  const profileData = {
    display_name: email.split('@')[0] || null,
    role: isAdmin ? ('admin' as const) : ('member' as const),
    membership_status: 'active',
    membership_type: 'standard' as const,
    membership_id: membershipId,
    subscription_status: isAdmin ? 'active' : 'free_tier',
    show_location_on_map: true,
  }

  let isNewRegistration = false

  if (existingProfile) {
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(profileData)
      .eq('id', userId)
    if (updateError) {
      console.error('register-free update error:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }
    isNewRegistration = true
  } else {
    const { error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert({ id: userId, ...profileData })
    if (insertError) {
      console.error('register-free insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }
    isNewRegistration = true
  }

  if (isNewRegistration) {
    // Welcome Bonus（リトライ時の重複防止）
    const { data: existingWelcome } = await supabaseAdmin
      .from('activity_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'Welcome Bonus')
      .single()

    if (!existingWelcome) {
      await supabaseAdmin.from('activity_logs').insert({
        user_id: userId,
        type: 'Welcome Bonus',
        note: 'ギルドへようこそ！',
        points: 100,
      })

      await notifyAdminNewMember({
        email,
        displayName: profileData.display_name,
        membershipType: profileData.membership_type,
        subscriptionStatus: profileData.subscription_status,
        invitedBy: null,
        inviteCode: null,
      }).catch(e => console.error('Admin notification error:', e))
    }
  }

  return NextResponse.json({ success: true })
}
