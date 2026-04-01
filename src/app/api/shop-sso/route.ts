import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SHOP_BASE_URL = process.env.SHOP_BASE_URL || 'https://shop.fomus.jp'
const SHOP_SSO_SECRET = process.env.SHOP_SSO_SECRET || ''

export async function GET() {
  if (!SHOP_SSO_SECRET) {
    return NextResponse.json({ error: 'SSO not configured' }, { status: 500 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.redirect(new URL('/auth/login', SHOP_BASE_URL))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const name = profile?.display_name || user.email.split('@')[0]

  // Call shop's SSO generate endpoint
  const res = await fetch(`${SHOP_BASE_URL}/api/auth/guild-sso/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': SHOP_SSO_SECRET,
    },
    body: JSON.stringify({ email: user.email, name }),
  })

  if (!res.ok) {
    console.error('Shop SSO generate failed:', await res.text())
    return NextResponse.redirect(SHOP_BASE_URL)
  }

  const { url } = await res.json()
  return NextResponse.redirect(url)
}
