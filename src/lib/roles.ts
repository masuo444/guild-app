import { createServiceClient } from '@/lib/supabase/server'

type ServiceClient = ReturnType<typeof createServiceClient>

/**
 * 「アンバサダー」ロール自動付与。
 *
 * 紹介コード経由で誰かに枡を売った（初めての Sales Reward）会員に、
 * 日本国内・海外を問わず自動でアンバサダー称号を付与する。
 * 称号は既存の custom_roles / member_roles（カラータグ表示）機構をそのまま使う。
 */
const AMBASSADOR_ROLE_NAME = 'アンバサダー'
const AMBASSADOR_ROLE_COLOR = 'yellow'
const AMBASSADOR_ROLE_DESCRIPTION = '紹介コードで枡の販売に貢献してくれたメンバーの称号'

async function getOrCreateAmbassadorRoleId(serviceClient: SupabaseClient): Promise<string | null> {
  const { data: existing } = await serviceClient
    .from('custom_roles')
    .select('id')
    .eq('name', AMBASSADOR_ROLE_NAME)
    .maybeSingle<{ id: string }>()

  if (existing) return existing.id

  const { data: created, error } = await serviceClient
    .from('custom_roles')
    .insert({
      name: AMBASSADOR_ROLE_NAME,
      color: AMBASSADOR_ROLE_COLOR,
      description: AMBASSADOR_ROLE_DESCRIPTION,
    })
    .select('id')
    .single<{ id: string }>()

  if (error) {
    // 競合(同時作成)の場合は再取得を試みる
    const { data: retry } = await serviceClient
      .from('custom_roles')
      .select('id')
      .eq('name', AMBASSADOR_ROLE_NAME)
      .maybeSingle<{ id: string }>()
    return retry?.id ?? null
  }

  return created?.id ?? null
}

/**
 * 対象メンバーにアンバサダーロールが無ければ付与する。
 * 既に持っている場合は何もしない（何度呼んでも安全）。
 */
export async function ensureAmbassadorRole(serviceClient: SupabaseClient, memberId: string): Promise<void> {
  const roleId = await getOrCreateAmbassadorRoleId(serviceClient)
  if (!roleId) return

  const { data: existingAssignment } = await serviceClient
    .from('member_roles')
    .select('id')
    .eq('member_id', memberId)
    .eq('role_id', roleId)
    .maybeSingle<{ id: string }>()

  if (existingAssignment) return

  await serviceClient.from('member_roles').insert({
    member_id: memberId,
    role_id: roleId,
  })
}
