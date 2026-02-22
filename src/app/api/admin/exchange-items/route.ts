import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { ADMIN_EMAILS } from '@/lib/access'

async function checkAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || ADMIN_EMAILS.includes(user.email as typeof ADMIN_EMAILS[number])
  return isAdmin ? user : null
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  try {
    const user = await checkAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const supabaseAdmin = getServiceClient()
    const { data, error } = await supabaseAdmin
      .from('exchange_items')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ items: data })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await checkAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { name, name_en, description, description_en, image_url, points_cost, stock, coupon_code } = body

    if (!name || !points_cost) {
      return NextResponse.json({ error: 'name and points_cost are required' }, { status: 400 })
    }

    const supabaseAdmin = getServiceClient()
    const { data, error } = await supabaseAdmin
      .from('exchange_items')
      .insert({
        name,
        name_en: name_en || null,
        description: description || null,
        description_en: description_en || null,
        image_url: image_url || null,
        points_cost: parseInt(String(points_cost)),
        stock: stock !== undefined ? parseInt(String(stock)) : -1,
        coupon_code: coupon_code || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ item: data })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await checkAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const supabaseAdmin = getServiceClient()
    const { data, error } = await supabaseAdmin
      .from('exchange_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ item: data })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
