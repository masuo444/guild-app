import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { notifyAdminKeepaliveFailure } from '@/lib/notifications'

/**
 * Supabase 無料プランの「7日間無操作で自動一時停止」を防ぐ定期ping。
 *
 * 二重化: Vercel Cron（毎日 03:00 UTC）と GitHub Actions（6時間ごと）の両方から呼ばれる。
 * 読み取り＋書き込み（app_settings.last_keepalive_at を更新）で確実に「活動」として計上させる。
 * 失敗時は管理者へ Resend でメール通知し、呼び出し元（GitHub Actions）も失敗扱いにして気づけるようにする。
 *
 * 認証: Authorization: Bearer <CRON_SECRET>（Vercel Cron は自動付与、GitHub Actions は secrets から付与）
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const source = request.nextUrl.searchParams.get('source') || 'vercel-cron'
  const now = new Date().toISOString()

  try {
    const sb = createServiceClient()

    const { error: readError } = await sb.from('app_settings').select('key').limit(1)
    if (readError) throw new Error(`read: ${readError.message}`)

    const { error: writeError } = await sb
      .from('app_settings')
      .upsert({ key: 'last_keepalive_at', value: now, updated_at: now }, { onConflict: 'key' })
    if (writeError) throw new Error(`write: ${writeError.message}`)

    return NextResponse.json({ ok: true, at: now, source })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('keepalive failed', { source, message })
    await notifyAdminKeepaliveFailure({ source, error: message })
    return NextResponse.json({ ok: false, error: message.slice(0, 200), source }, { status: 503 })
  }
}
