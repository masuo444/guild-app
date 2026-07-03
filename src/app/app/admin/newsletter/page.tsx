import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSetting } from '@/lib/settings'
import { NewsletterClient } from './NewsletterClient'

export default async function NewsletterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/app')

  const multiplier = parseInt((await getSetting('login_bonus_multiplier')) || '1', 10)
  const until = (await getSetting('login_bonus_campaign_until')) || ''

  return <NewsletterClient initialMultiplier={multiplier} initialUntil={until} />
}
