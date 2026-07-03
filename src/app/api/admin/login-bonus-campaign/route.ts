import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_EMAILS } from '@/lib/access'
import { setSetting, getLoginBonusMultiplier } from '@/lib/settings'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, status: 401 as const }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin' || ADMIN_EMAILS.includes(user.email as typeof ADMIN_EMAILS[number])
  if (!isAdmin) return { ok: false as const, status: 403 as const }
  return { ok: true as const }
}

// ログインボーナス倍率キャンペーンの設定（管理者のみ）
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: auth.status })

  let body
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { multiplier, until } = body as { multiplier?: number; until?: string | null }

  const m = Number(multiplier)
  if (!Number.isFinite(m) || m < 1 || m > 10) {
    return NextResponse.json({ error: 'multiplier must be 1-10' }, { status: 400 })
  }
  // until は YYYY-MM-DD または空文字（無期限）
  const untilStr = typeof until === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(until) ? until : ''

  await setSetting('login_bonus_multiplier', String(Math.round(m)))
  await setSetting('login_bonus_campaign_until', untilStr)

  const effective = await getLoginBonusMultiplier()
  return NextResponse.json({ success: true, multiplier: Math.round(m), until: untilStr, effective })
}
