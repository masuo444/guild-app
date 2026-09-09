import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getNotes } from '@/lib/archive'
import { NoteList } from '@/components/archive/NoteList'

export default async function NotePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/app/archive/note')
  return <NoteList notes={getNotes()} />
}
