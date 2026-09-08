'use client'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'

export function ReaderAccount({ email }: { email: string }) {
  const { language } = useLanguage()
  const ja = language === 'ja'
  return <div className="max-w-xl mx-auto p-6 md:p-10 text-white"><h1 className="text-2xl font-bold mb-6">{ja ? 'アカウント' : 'Account'}</h1><p className="text-sm text-zinc-300 break-all">{email}</p><p className="text-sm text-zinc-400 mt-3">{ja ? '無料プラン · 記事を読む' : 'Free plan · Read articles'}</p><div className="mt-8 p-6 rounded-xl bg-emerald-950 border border-emerald-700"><h2 className="font-bold text-xl">{ja ? '記事の先に、仲間と場所がある。' : 'People and places beyond the stories.'}</h2><p className="text-sm text-zinc-300 leading-relaxed mt-3">{ja ? '有料版ならギルドマップでメンバーとMASU Hubを探せます。' : 'Find members and MASU Hubs on the map with paid membership.'}</p><Link href="/auth/subscribe" className="inline-block mt-5 bg-lime-200 text-emerald-950 rounded-lg px-5 py-3 font-semibold text-sm">{ja ? 'マップが使えるプランを見る' : 'See plans with map access'}</Link></div><Link href="/app/feed" className="block mt-8 text-sm underline">{ja ? '記事に戻る' : 'Back to articles'}</Link><button onClick={async () => { await createClient().auth.signOut(); window.location.assign('/') }} className="mt-7 text-sm text-zinc-400">{ja ? 'ログアウト' : 'Log out'}</button></div>
}
