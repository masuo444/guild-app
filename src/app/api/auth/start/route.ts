import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { otpSendLimiter } from '@/lib/rateLimit'
import { getInviteMaxUses } from '@/lib/utils'
import { isFreeMembershipType, MembershipType } from '@/types/database'

const UNAVAILABLE = 'サーバーに接続できません。しばらくしてからもう一度お試しください。 / Cannot reach the server. Please try again later.'

/**
 * 統合エントリー: メールアドレス1つで「ログイン」も「無料会員登録」も始める。
 *
 * - 既存ユーザー → ログイン用OTPを送る（新規作成しない）
 * - 未登録 → 新規作成を許可してOTPを送る（招待コードがあればメタデータに付与）
 *
 * クライアントには exists / invite の結果だけ返し、トークン類は一切返さない。
 * OTP検証は従来通り /api/auth/verify-otp が行う。
 */
export async function POST(request: NextRequest) {
  let body: { email?: string; inviteCode?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  const inviteCode = body.inviteCode?.trim().toUpperCase() || null

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
  }

  if (!otpSendLimiter.check(email)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // 招待コードの事前検証（無効なコードで登録を進めない）
  let invite: { membershipType: MembershipType; isFree: boolean } | null = null
  if (inviteCode) {
    const { data, error } = await supabaseAdmin
      .from('invites')
      .select('used, membership_type, reusable, use_count, invited_by')
      .eq('code', inviteCode)
      .single()

    if (error && error.message?.includes('fetch failed')) {
      return NextResponse.json({ error: UNAVAILABLE, unavailable: true }, { status: 503 })
    }
    if (error || !data) {
      return NextResponse.json({ error: 'invalid_invite' }, { status: 400 })
    }

    let isValid = !data.used
    if (data.reusable) {
      const { data: allInvites } = await supabaseAdmin
        .from('invites')
        .select('use_count')
        .eq('invited_by', data.invited_by)
        .eq('reusable', true)
      const total = allInvites?.reduce((sum, inv) => sum + (inv.use_count || 0), 0) || 0
      isValid = (data.use_count || 0) < getInviteMaxUses(total)
    }
    if (!isValid) {
      return NextResponse.json({ error: 'used_invite' }, { status: 400 })
    }
    const membershipType = (data.membership_type || 'standard') as MembershipType
    invite = { membershipType, isFree: isFreeMembershipType(membershipType) }
  }

  // 既存ユーザーかどうか
  const { data: listed, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  if (listError) {
    console.error('auth/start: listUsers failed', listError)
    return NextResponse.json({ error: UNAVAILABLE, unavailable: true }, { status: 503 })
  }
  const exists = listed.users.some((u) => u.email?.toLowerCase() === email)

  // OTP送信（anonクライアント。Cookieは書かない）
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { error: otpError } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: !exists,
      ...(inviteCode && !exists ? { data: { invite_code: inviteCode } } : {}),
    },
  })

  if (otpError) {
    console.error('auth/start: signInWithOtp failed', otpError)
    if (/rate limit/i.test(otpError.message)) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
    }
    if (otpError.message.includes('fetch failed') || otpError.status === 0) {
      return NextResponse.json({ error: UNAVAILABLE, unavailable: true }, { status: 503 })
    }
    return NextResponse.json({ error: 'send_failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true, exists, invite })
}
