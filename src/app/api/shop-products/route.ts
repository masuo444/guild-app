import { NextResponse } from 'next/server'
import { createClient as createGuildClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@supabase/supabase-js'

const SHOP_SUPABASE_URL = process.env.SHOP_SUPABASE_URL || ''
const SHOP_SUPABASE_ANON_KEY = process.env.SHOP_SUPABASE_ANON_KEY || ''

export async function GET() {
  if (!SHOP_SUPABASE_URL || !SHOP_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Shop not configured', url: !!SHOP_SUPABASE_URL, key: !!SHOP_SUPABASE_ANON_KEY }, { status: 500 })
  }

  // Verify guild member is authenticated
  try {
    const guild = await createGuildClient()
    const { data: { user } } = await guild.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } catch (authError) {
    console.error('Auth check failed:', authError)
    return NextResponse.json({ error: 'Auth check failed' }, { status: 401 })
  }

  const shop = createBrowserClient(SHOP_SUPABASE_URL, SHOP_SUPABASE_ANON_KEY)

  // Get published shop IDs
  const { data: shops } = await shop
    .from('shops')
    .select('id')
    .eq('is_published', true)

  if (!shops || shops.length === 0) {
    return NextResponse.json([])
  }

  const shopIds = shops.map((s: { id: string }) => s.id)

  // Get published physical products
  const { data: products, error } = await shop
    .from('products')
    .select('*')
    .in('shop_id', shopIds)
    .eq('is_published', true)
    .eq('item_type', 'physical')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Shop products fetch error:', error)
    return NextResponse.json({ error: `Failed to fetch products: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json(products || [])
}
