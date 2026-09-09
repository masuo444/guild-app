'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

/** 無料会員向けの続き読みブロック。GUILDメンバー登録と、別アカウントでのログインを案内する */
export function Paywall({ light, ja, returnTo }: { light: boolean; ja: boolean; returnTo: string }) {
  const switchAccount = async () => {
    try { await createClient().auth.signOut() } catch {}
    window.location.href = `/auth/login?redirect=${encodeURIComponent(returnTo)}`
  }
  return (
    <div className={`mt-2 rounded-2xl border p-7 md:p-8 text-center ${light ? 'border-amber-200 bg-amber-50' : 'border-amber-500/25 bg-amber-500/5'}`}>
      <div className="text-2xl mb-2">🔒</div>
      <p className={`text-base font-semibold mb-2 ${light ? 'text-zinc-900' : 'text-white'}`}>
        {ja ? 'ここから先は、GUILDメンバー限定です' : 'The rest is for GUILD members'}
      </p>
      <p className={`text-sm leading-relaxed mb-5 ${light ? 'text-zinc-600' : 'text-zinc-300'}`}>
        {ja
          ? 'まっすーの活動記と学びを全記事・全文で。月980円から、いつでも解約できます。'
          : "Read every post in full — MaSU's journal and lessons. From ¥980/month, cancel anytime."}
      </p>
      <Link
        href="/auth/subscribe"
        className="inline-flex w-full sm:w-auto items-center justify-center px-6 py-3 bg-[#c0c0c0] text-zinc-900 rounded-lg text-sm font-semibold hover:bg-white transition-colors"
      >
        {ja ? 'GUILDメンバーになって続きを読む' : 'Become a GUILD member to keep reading'}
      </Link>
      <p className={`mt-4 text-xs ${light ? 'text-zinc-500' : 'text-zinc-400'}`}>
        {ja ? 'すでにメンバーの方は' : 'Already a member? '}
        <button onClick={switchAccount} className="underline underline-offset-2 hover:text-amber-500 ml-1">
          {ja ? 'こちらからログイン' : 'Log in here'}
        </button>
      </p>
    </div>
  )
}
