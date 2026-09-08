import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** 記事のキーワード検索（タイトル・本文）。一致した記事IDだけ返す */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const q = (req.nextUrl.searchParams.get('q') || '').trim().slice(0, 50)
  if (!q) return NextResponse.json({ ids: [] })
  const pattern = `%${q.replace(/[%_]/g, '\\$&')}%`
  const { data, error } = await supabase
    .from('feed_posts')
    .select('id')
    .or(`title.ilike.${pattern},body.ilike.${pattern}`)
    .limit(300)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ids: (data ?? []).map((r) => r.id) })
}
