import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * Supabase 無料プランの「7日間無操作で自動一時停止」を防ぐための定期ping。
 * Vercel Cron（vercel.json）から毎日呼ばれ、軽い読み取りクエリを1回投げるだけ。
 * Vercel は CRON_SECRET が設定されていると Authorization: Bearer <secret> を付けて呼ぶ。
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sb = createServiceClient()
    const { error } = await sb.from('app_settings').select('key').limit(1)
    if (error) {
      console.error('keepalive: query failed', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 503 })
    }
    return NextResponse.json({ ok: true, at: new Date().toISOString() })
  } catch (e) {
    console.error('keepalive: unreachable', e)
    return NextResponse.json({ ok: false, error: 'unreachable' }, { status: 503 })
  }
}
