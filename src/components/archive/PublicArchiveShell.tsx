'use client'

import Link from 'next/link'
import { LanguageProvider, useLanguage } from '@/lib/i18n'

function Header() {
  const { language, setLanguage } = useLanguage()
  const ja = language === 'ja'
  return (
    <header className="sticky top-0 z-40 bg-zinc-900/80 backdrop-blur border-b border-zinc-700/50">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <Link href="/" className="text-xs tracking-[0.25em] text-[#c0c0c0] hover:text-white transition-colors">
          FOMUS GUILD
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-zinc-600 overflow-hidden text-[11px]">
            <button
              onClick={() => setLanguage('ja')}
              className={`px-2.5 py-1 transition-colors ${ja ? 'bg-[#c0c0c0] text-zinc-900' : 'text-zinc-300 hover:bg-white/5'}`}
            >日本語</button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 transition-colors ${!ja ? 'bg-[#c0c0c0] text-zinc-900' : 'text-zinc-300 hover:bg-white/5'}`}
            >EN</button>
          </div>
          <Link
            href="/auth/login"
            className="px-3 py-1.5 rounded-full bg-[#c0c0c0] text-zinc-900 text-xs font-semibold hover:bg-white transition-colors whitespace-nowrap"
          >
            {ja ? '無料登録' : 'Sign up'}
          </Link>
        </div>
      </div>
    </header>
  )
}

export function PublicArchiveShell({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
        <Header />
        <main>{children}</main>
      </div>
    </LanguageProvider>
  )
}
