import { createServiceClient } from '@/lib/supabase/server'

type ServiceClient = ReturnType<typeof createServiceClient>

/**
 * アンバサダー称号（段階制）。
 *
 * 紹介コード経由の枡販売が成立した累計回数に応じて、称号が
 * ブロンズ→シルバー→ゴールドと上がっていく。国内・海外を問わない。
 * 称号は既存の custom_roles / member_roles（カラータグ表示）機構をそのまま使う。
 * 上位に上がったら下位の称号は外し、常に最高位のみを表示する。
 */
const AMBASSADOR_TIERS = [
  { threshold: 15, name: 'ゴールドアンバサダー', color: 'yellow', description: '紹介コード経由の枡販売が累計15件を超えたメンバーの称号' },
  { threshold: 5, name: 'シルバーアンバサダー', color: 'cyan', description: '紹介コード経由の枡販売が累計5件を超えたメンバーの称号' },
  { threshold: 1, name: 'ブロンズアンバサダー', color: 'orange', description: '紹介コードで初めて枡の販売に貢献してくれたメンバーの称号' },
] as const

async function getOrCreateRoleId(
  serviceClient: ServiceClient,
  name: string,
  color: string,
  description: string
): Promise<string | null> {
  const { data: existing } = await serviceClient
    .from('custom_roles')
    .select('id')
    .eq('name', name)
    .maybeSingle<{ id: string }>()

  if (existing) return existing.id

  const { data: created, error } = await serviceClient
    .from('custom_roles')
    .insert({ name, color, description })
    .select('id')
    .single<{ id: string }>()

  if (error) {
    // 競合(同時作成)の場合は再取得を試みる
    const { data: retry } = await serviceClient
      .from('custom_roles')
      .select('id')
      .eq('name', name)
      .maybeSingle<{ id: string }>()
    return retry?.id ?? null
  }

  return created?.id ?? null
}

/**
 * 対象メンバーの累計紹介成立数を数え、該当する最高位のアンバサダー称号だけを
 * 付与する（下位の称号は外す）。称号が変わらない/未達の場合は何もしない。
 * 何度呼んでも安全（冪等）。
 */
export async function updateAmbassadorTier(serviceClient: ServiceClient, memberId: string): Promise<void> {
  const { count } = await serviceClient
    .from('sales_credits')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', memberId)

  const referralCount = count ?? 0
  const qualifiedTier = AMBASSADOR_TIERS.find((t) => referralCount >= t.threshold)
  if (!qualifiedTier) return

  const tierRoleId = await getOrCreateRoleId(serviceClient, qualifiedTier.name, qualifiedTier.color, qualifiedTier.description)
  if (!tierRoleId) return

  // 他の階層の称号ロールIDを取得（既に付与されていれば外すため）
  const otherTierNames = AMBASSADOR_TIERS.filter((t) => t.name !== qualifiedTier.name).map((t) => t.name)
  const { data: otherTierRoles } = await serviceClient
    .from('custom_roles')
    .select('id')
    .in('name', otherTierNames)

  const otherTierRoleIds = (otherTierRoles ?? []).map((r) => r.id)
  if (otherTierRoleIds.length > 0) {
    await serviceClient
      .from('member_roles')
      .delete()
      .eq('member_id', memberId)
      .in('role_id', otherTierRoleIds)
  }

  const { data: existingAssignment } = await serviceClient
    .from('member_roles')
    .select('id')
    .eq('member_id', memberId)
    .eq('role_id', tierRoleId)
    .maybeSingle<{ id: string }>()

  if (existingAssignment) return

  await serviceClient.from('member_roles').insert({
    member_id: memberId,
    role_id: tierRoleId,
  })
}
