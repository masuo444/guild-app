import Link from 'next/link'

// ログイン機能は一時的に無効化
export default async function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* ナビゲーション */}
      <nav className="absolute top-0 left-0 right-0 p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">FOMUS GUILD</h1>
          <Link
            href="/app"
            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            Enter App
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
              href="/app"
              className="px-8 py-3 bg-white text-zinc-900 rounded-lg font-medium hover:bg-zinc-100 transition-colors"
            >
              Enter App
            </Link>
            <Link
              href="/app?demo=true"
              className="px-8 py-3 border border-zinc-500 text-white rounded-lg font-medium hover:bg-white/10 transition-colors"
            >
              Try Demo
            </Link>
          </div>

        </div>
      </main>
    </div>
  )
}
