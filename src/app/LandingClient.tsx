'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Language, getInitialLanguage } from '@/lib/i18n'
import { StandaloneLanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { formatPostDate, stripDatePrefix } from '@/lib/feed'

const LANGUAGE_KEY = 'fomus-guild-language'

export interface LandingStats { members: number; countries: number; hubs: number; posts: number }
export interface LandingPost { id: string; title: string; excerpt: string; minutes: number; published_at: string }

const COPY = {
  ja: {
    login: 'ログイン',
    tagline: '文化共創コミュニティ',
    eyebrow: '枡ブランド FOMUS のコミュニティ',
    h1a: '日本を旅し、世界を旅し、',
    h1b: 'いまは山梨・笛吹市から。',
    h1c: '枡でつながる、世界のコミュニティ。',
    lead: 'FOMUS GUILDは、日本の伝統工芸「枡」のブランド FOMUS が運営する、世界中の枡コミュニティが集まるオンラインコミュニティです。代表まっすーの日々の活動記と学びを、会員限定のサロン記事としてほぼ毎日更新しています。',
    join: '無料で参加する',
    joinNote: 'メールアドレスだけ・30秒',
    haveAccount: 'ログインはこちら',
    statMembers: '会員', statCountries: 'カ国', statHubs: '枡拠点', statPosts: 'サロン記事',
    whatTitle: 'FOMUS GUILDとは',
    pillars: [
      { icon: '🌍', title: '世界中の枡コミュニティが集まる場', desc: '日本各地と海外に散らばる枡の仲間が、ひとつのマップとフィードでつながります。誰がどこにいて、何をしているかが見える場所。' },
      { icon: '📖', title: 'まっすーの活動記と学び', desc: '笛吹市で地域共創プロデューサーとして動く毎日を、会員限定のサロン記事に。出来事の記録だけでなく、そこから得た「学び」を毎回添えています。' },
      { icon: '🍶', title: '枡から始まる文化共創', desc: 'クエストに挑んでポイントを貯め、限定グッズや笛吹BASEの宿泊券と交換。枡を囲む場を、オンラインからリアルへ。' },
    ],
    journeyTitle: 'まっすーの歩み',
    journeyLead: 'ホテルマンから伝統工芸ブランドの代表へ。アドレスホッパーとして日本と世界を旅し、いまは山梨・笛吹市に根を張っています。',
    journey: [
      { when: 'FOMUS', title: '枡ブランド「FOMUS」を立ち上げる', desc: '日本の伝統工芸・木枡を、現代のプロダクトとして国内外へ発信。5年目を迎えたブランドの代表。' },
      { when: '日本全国', title: '拠点を持たず、日本各地を巡る', desc: '多拠点生活サービスを使い倒し、地域を盛り上げるプレイヤーたちと各地で出会う。' },
      { when: '世界', title: '40カ国以上を旅するアドレスホッパー', desc: '約4年半、家を持たずに世界を移動しながら、枡を海外へ届ける活動を続ける。' },
      { when: '2026年6月〜', title: '山梨県笛吹市へ移住、地域共創プロデューサーに', desc: '地域おこし協力隊として、市の内と外をつなぐコミュニティづくりに取り組む。その毎日をサロン記事に記録中。' },
    ],
    postsTitle: '最新のサロン記事',
    postsLead: '会員限定で、ほぼ毎日更新。ログイン前でも冒頭だけ読めます。',
    readMore: '続きは参加後に読めます →',
    minutes: (m: number) => `約${m}分`,
    plansTitle: '参加するとできること',
    free: '無料で参加', freeNote: '招待コード不要',
    freeItems: ['サロン記事を読む（無料記事）', 'クエストに挑戦してポイントを貯める', '限定ショップで交換', 'メンバーカード＆プロフィール'],
    paid: '有料会員', paidNote: '月980円〜', paidLead: '無料でできること + 下記',
    paidItems: ['世界のメンバーMAP（誰がどこにいるか）', 'まっすーの限定記事（有料回）', '笛吹BASEへの訪問権', 'イベント・企画への優先参加'],
    upgradeNote: '参加後、アプリ内からいつでもアップグレードできます',
    finalTitle: 'まずは、中を覗いてみてください。',
    finalLead: '参加者は「ユーザー」ではなく、文化づくりの仲間として迎えられます。',
    guide: 'ガイドを見る',
    footer: '運営：FOMUS / MaSU',
  },
  en: {
    login: 'Log in',
    tagline: 'Culture Co-creation',
    eyebrow: 'The community of the Masu brand FOMUS',
    h1a: 'Across Japan, around the world,',
    h1b: 'and now from Fuefuki, Yamanashi.',
    h1c: 'A global community connected by Masu.',
    lead: "FOMUS GUILD is the online community run by FOMUS, a brand of the traditional Japanese craft Masu, where Masu communities around the world come together. Our founder MaSU shares his daily activities and lessons in members-only salon posts, almost every day.",
    join: 'Join for free',
    joinNote: 'Email only · 30 seconds',
    haveAccount: 'Already a member? Log in',
    statMembers: 'members', statCountries: 'countries', statHubs: 'Masu hubs', statPosts: 'salon posts',
    whatTitle: 'What is FOMUS GUILD?',
    pillars: [
      { icon: '🌍', title: 'Where Masu communities meet', desc: 'Friends of Masu across Japan and overseas, connected on one map and one feed. See who is where and what they are up to.' },
      { icon: '📖', title: "MaSU's journal & lessons", desc: 'Members-only salon posts on his daily work as a community producer in Fuefuki, each with the lessons he took from it.' },
      { icon: '🍶', title: 'Co-creation that starts with Masu', desc: 'Take on quests, earn points, redeem exclusive goods or a stay at Fuefuki BASE. From online to real gatherings around Masu.' },
    ],
    journeyTitle: "MaSU's journey",
    journeyLead: 'From hotelier to founder of a craft brand. An address-hopper across Japan and the world, now rooted in Fuefuki, Yamanashi.',
    journey: [
      { when: 'FOMUS', title: 'Founded the Masu brand FOMUS', desc: 'Bringing the traditional wooden Masu to the world as a modern product. Now in its fifth year.' },
      { when: 'Japan', title: 'Traveled Japan without a fixed home', desc: 'Living across multi-base services and meeting local players who energize their regions.' },
      { when: 'World', title: 'Address-hopper across 40+ countries', desc: 'About four and a half years on the move, delivering Masu overseas.' },
      { when: 'June 2026 –', title: 'Moved to Fuefuki, Yamanashi as a community producer', desc: 'Building a community that connects the city with the outside world, and journaling it here almost daily.' },
    ],
    postsTitle: 'Latest salon posts',
    postsLead: 'Members-only, updated almost daily. You can read the opening before joining.',
    readMore: 'Join to read the rest →',
    minutes: (m: number) => `${m} min`,
    plansTitle: 'What you get',
    free: 'Free', freeNote: 'No invite needed',
    freeItems: ['Read salon posts (free ones)', 'Take on quests and earn points', 'Redeem in the members shop', 'Member card & profile'],
    paid: 'Paid Member', paidNote: 'from ¥980/mo', paidLead: 'Everything in Free, plus:',
    paidItems: ['Global member MAP (who is where)', "MaSU's premium posts", 'Access to Fuefuki BASE', 'Priority access to events & projects'],
    upgradeNote: 'Upgrade anytime from inside the app',
    finalTitle: 'Come take a look inside.',
    finalLead: 'Members are welcomed not as users, but as companions in cultural creation.',
    guide: 'View Guide',
    footer: 'Operated by FOMUS / MaSU',
  },
}

export function LandingClient({ stats, posts }: { stats: LandingStats; posts: LandingPost[] }) {
  const [language, setLanguage] = useState<Language>('ja')
  useEffect(() => { setLanguage(getInitialLanguage()) }, [])
  const c = COPY[language]
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem(LANGUAGE_KEY, lang)
  }

  const statItems = [
    stats.members > 0 && { n: stats.members, label: c.statMembers },
    stats.countries > 1 && { n: stats.countries, label: c.statCountries },
    stats.hubs > 0 && { n: stats.hubs, label: c.statHubs },
    stats.posts > 0 && { n: stats.posts, label: c.statPosts },
  ].filter(Boolean) as { n: number; label: string }[]

  const primary = 'inline-flex items-center justify-center px-8 py-3.5 bg-stone-800 text-white rounded-full font-medium text-sm md:text-base hover:bg-stone-700 transition-colors shadow-lg'

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-green-50 text-stone-800">
      {/* Header */}
      <header className="w-full px-6 md:px-8 py-5">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-lg md:text-xl font-semibold tracking-wide text-stone-700">FOMUS GUILD</p>
            <p className="text-[11px] text-stone-500 tracking-widest mt-0.5">{c.tagline}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">{c.login}</Link>
            <StandaloneLanguageSwitcher language={language} onLanguageChange={handleLanguageChange} theme="light" />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 md:px-8 pt-6 md:pt-12 pb-12">
        <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-8 md:gap-12 items-center">
          <div className="md:col-span-3 text-center md:text-left">
            <p className="text-xs md:text-sm tracking-widest text-amber-700 font-medium mb-4">{c.eyebrow}</p>
            <h1 className="text-[26px] md:text-4xl lg:text-[44px] font-medium leading-[1.4] tracking-wide text-stone-800 mb-6">
              {c.h1a}<br />{c.h1b}<br /><span className="font-semibold">{c.h1c}</span>
            </h1>
            <p className="text-sm md:text-base text-stone-600 leading-relaxed mb-8 max-w-xl mx-auto md:mx-0">{c.lead}</p>
            <div className="flex flex-col sm:flex-row items-center gap-3 md:justify-start justify-center">
              <Link href="/auth/login" className={`${primary} min-w-[200px]`}>{c.join}</Link>
              <span className="text-xs text-stone-500">{c.joinNote}</span>
            </div>
            <div className="mt-3 flex justify-center md:justify-start">
              <Link href="/auth/login" className="text-sm text-stone-500 hover:text-stone-800 underline underline-offset-4">{c.haveAccount}</Link>
            </div>
          </div>
          <div className="md:col-span-2 flex justify-center">
            <div className="relative w-full max-w-xs md:max-w-sm aspect-square rounded-2xl overflow-hidden shadow-xl">
              <Image src="/fomus-masu.png" alt="FOMUS Masu - Japanese traditional wooden cups" fill className="object-cover" priority />
            </div>
          </div>
        </div>

        {statItems.length > 0 && (
          <div className="max-w-5xl mx-auto mt-10 md:mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {statItems.map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/70 border border-stone-200 px-4 py-4 text-center">
                <p className="text-2xl md:text-3xl font-semibold text-stone-800 tabular-nums">{s.n.toLocaleString()}</p>
                <p className="text-xs text-stone-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* What is */}
      <section className="px-6 md:px-8 py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl md:text-2xl font-semibold text-stone-800 mb-8 text-center">{c.whatTitle}</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {c.pillars.map((p) => (
              <div key={p.title} className="rounded-2xl bg-white/70 border border-stone-200 p-6">
                <div className="text-3xl mb-3">{p.icon}</div>
                <h3 className="font-semibold text-stone-800 mb-2 leading-snug">{p.title}</h3>
                <p className="text-sm text-stone-600 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey */}
      <section className="px-6 md:px-8 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl md:text-2xl font-semibold text-stone-800 mb-3 text-center">{c.journeyTitle}</h2>
          <p className="text-sm text-stone-600 text-center leading-relaxed mb-10">{c.journeyLead}</p>
          <ol className="relative border-l border-amber-300 ml-3 space-y-8">
            {c.journey.map((j, i) => (
              <li key={i} className="pl-7 relative">
                <span className={`absolute -left-[7px] top-1.5 w-3 h-3 rounded-full ${i === c.journey.length - 1 ? 'bg-amber-600' : 'bg-amber-300'}`} />
                <p className="text-[11px] tracking-widest text-amber-700 font-medium mb-1">{j.when}</p>
                <h3 className="font-semibold text-stone-800 leading-snug">{j.title}</h3>
                <p className="text-sm text-stone-600 leading-relaxed mt-1">{j.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Latest posts */}
      {posts.length > 0 && (
        <section className="px-6 md:px-8 py-12 md:py-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl md:text-2xl font-semibold text-stone-800 mb-2 text-center">{c.postsTitle}</h2>
            <p className="text-sm text-stone-500 text-center mb-8">{c.postsLead}</p>
            <div className="grid md:grid-cols-3 gap-5">
              {posts.map((p) => (
                <Link key={p.id} href="/auth/login" className="group rounded-2xl bg-white/80 border border-stone-200 p-5 hover:border-stone-400 transition-colors flex flex-col">
                  <p className="text-[11px] text-stone-500 mb-2">{formatPostDate(p.published_at, language)} · {c.minutes(p.minutes)}</p>
                  <h3 className="font-semibold text-stone-800 leading-snug mb-2">{stripDatePrefix(p.title)}</h3>
                  <p className="text-sm text-stone-600 leading-relaxed line-clamp-4 flex-1">{p.excerpt}</p>
                  <p className="text-xs text-amber-700 mt-4 group-hover:underline">{c.readMore}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Plans */}
      <section className="px-6 md:px-8 py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl md:text-2xl font-semibold text-stone-800 mb-8 text-center">{c.plansTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-stone-200 bg-white/70 p-6">
              <div className="flex items-baseline justify-between mb-4">
                <h3 className="text-base font-semibold text-stone-800">{c.free}</h3>
                <span className="text-xs text-stone-400">{c.freeNote}</span>
              </div>
              <ul className="space-y-2.5 text-sm text-stone-600">
                {c.freeItems.map((item) => (
                  <li key={item} className="flex items-start gap-2"><span className="text-emerald-600 mt-0.5">✓</span><span>{item}</span></li>
                ))}
              </ul>
              <Link href="/auth/login" className="mt-6 inline-flex w-full items-center justify-center px-6 py-3 bg-stone-800 text-white rounded-full font-medium text-sm hover:bg-stone-700 transition-colors">{c.join}</Link>
            </div>
            <div className="rounded-2xl border border-amber-300 bg-gradient-to-b from-amber-50 to-white p-6 shadow-sm">
              <div className="flex items-baseline justify-between mb-4">
                <h3 className="text-base font-semibold text-stone-800">{c.paid}</h3>
                <span className="text-xs font-medium text-amber-700">{c.paidNote}</span>
              </div>
              <p className="text-xs text-stone-500 mb-4">{c.paidLead}</p>
              <ul className="space-y-2.5 text-sm text-stone-700">
                {c.paidItems.map((item) => (
                  <li key={item} className="flex items-start gap-2"><span className="text-amber-600 mt-0.5">★</span><span>{item}</span></li>
                ))}
              </ul>
              <p className="mt-6 text-center text-xs text-stone-400">{c.upgradeNote}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 md:px-8 py-16 md:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-medium text-stone-800 mb-3">{c.finalTitle}</h2>
          <p className="text-sm text-stone-600 mb-8">{c.finalLead}</p>
          <Link href="/auth/login" className={`${primary} min-w-[220px]`}>{c.join}</Link>
          <div className="mt-5">
            <Link href="/guide" className="text-xs text-stone-400 hover:text-stone-600 underline underline-offset-2">{c.guide}</Link>
          </div>
        </div>
      </section>

      <footer className="w-full p-6 md:p-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-stone-400">{c.footer}</p>
        </div>
      </footer>
    </div>
  )
}
