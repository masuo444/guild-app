import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { isFreeMembershipType, MembershipType } from '@/types/database'
import { getInviteMaxUses } from '@/lib/utils'

/**
 * Validates a single invite code for the public (logged-out) invite page.
 *
 * Uses the service-role client to read one invite by exact code, and returns
 * ONLY the minimal fields the landing page needs — never the full invite list.
 * This lets the invites table's SELECT RLS stay locked to authenticated users
 * (so codes aren't enumerable by anon visitors) while the signup funnel keeps
 * working for logged-out people.
 */
export async function POST(request: NextRequest) {
  let body: { code?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const code = body.code?.trim()
  if (!code) {
    return NextResponse.json({ error: 'Missing invite code' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await supabaseAdmin
    .from('invites')
    .select('used, membership_type, reusable, use_count, invited_by')
    .eq('code', code)
    .single()

  if (error || !data) {
    return NextResponse.json({ status: 'invalid' })
  }

  // reusable の場合は招待者ごとの動的上限で判定
  let isValid = !data.used
  if (data.reusable) {
    const { data: allInvites } = await supabaseAdmin
      .from('invites')
      .select('use_count')
      .eq('invited_by', data.invited_by)
      .eq('reusable', true)
    const totalInvites = allInvites?.reduce((sum, inv) => sum + (inv.use_count || 0), 0) || 0
    const maxUses = getInviteMaxUses(totalInvites)
    isValid = (data.use_count || 0) < maxUses
  }

  if (!isValid) {
    return NextResponse.json({ status: 'used' })
  }

  const membershipType = (data.membership_type || 'standard') as MembershipType

  return NextResponse.json({
    status: 'valid',
    membershipType,
    isFree: isFreeMembershipType(membershipType),
  })
}
