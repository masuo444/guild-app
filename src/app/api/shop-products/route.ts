import { NextResponse } from 'next/server'
import { createClient as createGuildClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const SHOP_SUPABASE_URL = (process.env.SHOP_SUPABASE_URL || '').trim()
    const SHOP_SUPABASE_ANON_KEY = (process.env.SHOP_SUPABASE_ANON_KEY || '').trim()

    if (!SHOP_SUPABASE_URL || !SHOP_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Shop not configured' }, { status: 500 })
    }

    // Verify guild member is authenticated
    const guild = await createGuildClient()
    const { data: { user } } = await guild.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const shop = createBrowserClient(SHOP_SUPABASE_URL, SHOP_SUPABASE_ANON_KEY)

    // Get published shop IDs
    const { data: shops, error: shopError } = await shop
      .from('shops')
      .select('id')
      .eq('is_published', true)

    if (shopError) {
      return NextResponse.json({ error: `Shop query failed: ${shopError.message}` }, { status: 500 })
    }

    if (!shops || shops.length === 0) {
      return NextResponse.json({ error: 'No shops found' }, { status: 200 })
    }

    const shopIds = shops.map((s: { id: string }) => s.id)

    // Get published physical products
    const { data: products, error: prodError } = await shop
      .from('products')
      .select('*')
      .in('shop_id', shopIds)
      .eq('is_published', true)
      .eq('item_type', 'physical')
      .order('sort_order', { ascending: true })

    if (prodError) {
      return NextResponse.json({ error: `Products query failed: ${prodError.message}` }, { status: 500 })
    }

    return NextResponse.json(products || [])
  } catch (e) {
    return NextResponse.json({ error: `Server error: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 })
  }
}
