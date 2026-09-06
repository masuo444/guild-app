import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingForm } from './OnboardingForm'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/login')
  }

  // 参加直後の「はじめの一歩」画面。名前だけ決めればすぐ始められる（スキップ可）。
  // 完成済みでも直接アクセスは許可する（名前を変えたい場合など）。

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <OnboardingForm profile={profile} email={user.email || ''} />
      </div>
    </div>
  )
}
