import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ログイン済みの場合はダッシュボードへ
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, membership_status')
      .eq('id', user.id)
      .single()

    if (profile?.subscription_status === 'active' && profile?.membership_status === 'active') {
      redirect('/app')
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* ナビゲーション */}
      <nav className="absolute top-0 left-0 right-0 p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">FOMUS GUILD</h1>
          <Link
            href="/auth/login"
            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* ヒーロー */}
      <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-sm mb-6">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            Invitation Only
          </div>

          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            A Private Guild for
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200">
              Global Creators
            </span>
          </h2>

          <p className="text-lg text-zinc-400 mb-8 max-w-lg mx-auto">
            Connect with like-minded members, unlock exclusive benefits,
            and grow together across borders.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/login"
              className="px-8 py-3 bg-white text-zinc-900 rounded-lg font-medium hover:bg-zinc-100 transition-colors"
            >
              Member Login
            </Link>
          </div>

          <p className="mt-8 text-sm text-zinc-500">
            Don&apos;t have an invite? Ask a current member for an invitation link.
          </p>
        </div>

        {/* 特徴 */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-amber-400">$10</p>
              <p className="text-sm text-zinc-500">/ month</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-400">Global</p>
              <p className="text-sm text-zinc-500">Community</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-400">Exclusive</p>
              <p className="text-sm text-zinc-500">Benefits</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
