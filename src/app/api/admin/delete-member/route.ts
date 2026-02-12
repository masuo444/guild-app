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

    const { memberId } = body

    if (!memberId) {
      return NextResponse.json({ error: 'memberId is required' }, { status: 400 })
    }

    // 自分自身の削除を防止
    if (memberId === user.id) {
      return NextResponse.json({ error: '自分自身を削除することはできません' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // 関連データを順番に削除
    await supabaseAdmin.from('member_roles').delete().eq('member_id', memberId)
    await supabaseAdmin.from('quest_submissions').delete().eq('user_id', memberId)
    await supabaseAdmin.from('activity_logs').delete().eq('user_id', memberId)
    await supabaseAdmin.from('profiles').delete().eq('id', memberId)

    // Auth ユーザーも削除
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(memberId)
    if (authError) {
      console.error('Auth user delete error:', authError)
      return NextResponse.json({ error: `Auth削除エラー: ${authError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete member error:', error)
    return NextResponse.json({ error: `Server error: ${error instanceof Error ? error.message : 'Unknown'}` }, { status: 500 })
  }
}
