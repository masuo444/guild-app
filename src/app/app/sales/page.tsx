import { hasMemberAccess } from '@/lib/member-access'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SalesClient from './SalesClient'

export default async function SalesPage() {
  if (!await hasMemberAccess()) redirect('/auth/subscribe')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return <SalesClient />
}
