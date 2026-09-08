import { createClient } from '@/lib/supabase/server'
import { hasFullAccess, isAdminEmail } from '@/lib/access'
import type { SubscriptionStatus } from '@/types/database'

/** Server-side gate for features beyond the free article reader. */
export async function hasMemberAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  if (isAdminEmail(user.email)) return true
  const { data: profile } = await supabase.from('profiles')
    .select('role, subscription_status').eq('id', user.id).single()
  return profile?.role === 'admin' || hasFullAccess((profile?.subscription_status || 'free_tier') as SubscriptionStatus)
}
