import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { ADMIN_EMAILS } from '@/lib/access'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // 認証チェック
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 管理者チェック
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin' || ADMIN_EMAILS.includes(user.email as typeof ADMIN_EMAILS[number])

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { userId, serialNumber } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // serialNumber が null or undefined → nullに設定（クリア）、数値ならその値を設定
    const serialValue = serialNumber === null || serialNumber === undefined || serialNumber === ''
      ? null
      : parseInt(String(serialNumber))

    if (serialValue !== null && (isNaN(serialValue) || serialValue < 0)) {
      return NextResponse.json({ error: 'serialNumber must be a positive integer' }, { status: 400 })
    }

    // Service Roleで書き込み
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ serial_number: serialValue })
      .eq('id', userId)

    if (error) {
      console.error('Update serial number DB error:', error)
      return NextResponse.json({ error: `DB Error: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update serial number error:', error)
    return NextResponse.json({ error: `Server error: ${error instanceof Error ? error.message : 'Unknown'}` }, { status: 500 })
  }
}
