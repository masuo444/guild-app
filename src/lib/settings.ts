import { createServiceClient } from '@/lib/supabase/server'

/**
 * app_settings（キー・バリュー）を service-role で読み書きするヘルパー。
 * RLSをバイパスするため、呼び出し側で管理者検証を済ませておくこと（書き込み時）。
 */

export async function getSetting(key: string): Promise<string | null> {
  const sb = createServiceClient()
  const { data } = await sb.from('app_settings').select('value').eq('key', key).single()
  return data?.value ?? null
}

export async function setSetting(key: string, value: string): Promise<void> {
  const sb = createServiceClient()
  await sb.from('app_settings').upsert(
    { key, value, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )
}

/**
 * 現在有効なログインボーナス倍率を返す。
 * campaign_until が設定されていて、その日付を過ぎていれば 1 に戻す。
 */
export async function getLoginBonusMultiplier(): Promise<number> {
  const sb = createServiceClient()
  const { data } = await sb.from('app_settings').select('key, value').in('key', ['login_bonus_multiplier', 'login_bonus_campaign_until'])
  const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]))
  const until = map['login_bonus_campaign_until']
  if (until) {
    // until は YYYY-MM-DD。今日(JST)がそれより後ならキャンペーン終了
    const todayJst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10)
    if (todayJst > until) return 1
  }
  const m = parseInt(map['login_bonus_multiplier'] || '1', 10)
  return Number.isFinite(m) && m >= 1 && m <= 10 ? m : 1
}
