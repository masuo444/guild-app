import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ShopClient from './ShopClient'

export default async function ShopPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, home_country, home_city')
    .eq('id', user.id)
    .single()

  return (
    <ShopClient
      userEmail={user.email || ''}
      userName={profile?.display_name || ''}
    />
  )
}
