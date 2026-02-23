import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { exchangeLimiter } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!exchangeLimiter.check(user.id)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await request.json()
    const { item_id } = body

    if (!item_id) {
      return NextResponse.json({ error: 'item_id is required' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Atomic exchange via RPC (balance check + deduction + order + stock update)
    const { data, error } = await supabaseAdmin.rpc('exchange_order', {
      p_user_id: user.id,
      p_item_id: item_id,
    })

    if (error) {
      console.error('Exchange RPC error:', error)
      return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }

    // RPC returns { error, status } on failure or { success: true } on success
    if (data?.error) {
      return NextResponse.json({ error: data.error }, { status: data.status || 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
