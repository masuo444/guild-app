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
          {ja ? '485本すべてを、全文で。' : 'All 485 posts, in full.'}
        </h2>
        <p className="text-sm text-zinc-300 leading-relaxed mb-2">
          {ja
            ? 'ここで公開しているのは、海外活動記録485本のうち57本です。GUILDメンバーになると、セブ島からヨーロッパ、中東までの485本を全文で読めます。'
            : 'What you see here is 57 of 485 overseas journal posts. GUILD members read all 485 in full — from Cebu to Europe and the Middle East.'}
        </p>
        <p className="text-sm text-zinc-400 leading-relaxed mb-6">
          {ja
            ? 'あわせて、笛吹市での「いま」の活動記録、世界の仲間を探せるギルドマップ、ポイント交換、紹介で売上の10%が戻る仕組みも使えるようになります。'
            : 'You also get the current journal from Fuefuki, the guild map to find members worldwide, point exchanges, and a referral link that returns 10% of any MASU sale to you.'}
        </p>
        <Link
          href="/auth/login"
          className="block w-full text-center bg-[#c0c0c0] text-zinc-900 py-3.5 rounded-full text-sm font-semibold hover:bg-white transition-colors"
        >
          {ja ? 'FOMUS GUILD に参加する' : 'Join FOMUS GUILD'}
        </Link>
        <p className="text-[11px] text-zinc-500 text-center mt-3">
          {ja
            ? '無料登録もできます（公開記事と、各記事の冒頭を読めます）'
            : 'Free sign-up is available too (public posts, plus the opening of every post).'}
        </p>
      </div>
    </section>
  )
}
