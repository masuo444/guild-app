'use client'

import Link from 'next/link'
import { useLanguage } from '@/lib/i18n'

/**
 * 公開アーカイブの末尾に出す登録導線。
 * 公開しているのは485本のうち一部なので、「続きは無料登録で」を正直に伝える。
 */
export function PublicArchiveCta() {
  const { language } = useLanguage()
  const ja = language === 'ja'

  return (
    <section className="px-4 pb-24 md:pb-16">
      <div className="max-w-2xl mx-auto rounded-2xl border border-zinc-700/50 bg-zinc-800/60 p-6 md:p-8">
        <p className="text-[10px] tracking-[0.25em] uppercase text-zinc-500 mb-3">FOMUS GUILD</p>
        <h2 className="text-xl font-bold text-white mb-3">
          {ja ? '続きは、485本すべて読めます' : 'Read all 485 posts'}
        </h2>
        <p className="text-sm text-zinc-300 leading-relaxed mb-2">
          {ja
            ? 'ここで公開しているのは、海外活動記録485本のうちの一部です。無料登録すると、セブ島からヨーロッパ、中東までの記録を全文読めます。'
            : 'What you see here is a selection from 485 posts. Sign up free to read all of them — from Cebu to Europe and the Middle East.'}
        </p>
        <p className="text-sm text-zinc-400 leading-relaxed mb-6">
          {ja
            ? 'FOMUS GUILDは、枡を通じて世界とつながる人たちのコミュニティです。登録は無料で、招待コードは要りません。'
            : 'FOMUS GUILD is a community of people connected through MASU, the Japanese wooden cup. Signing up is free and needs no invite code.'}
        </p>
        <Link
          href="/auth/login"
          className="block w-full text-center bg-[#c0c0c0] text-zinc-900 py-3.5 rounded-full text-sm font-semibold hover:bg-white transition-colors"
        >
          {ja ? '無料で登録して全文を読む' : 'Sign up free and read everything'}
        </Link>
        <p className="text-[11px] text-zinc-500 text-center mt-3">
          {ja ? 'メールアドレスだけで登録できます' : 'Just your email address'}
        </p>
      </div>
    </section>
  )
}
