'use client'

import { useState, useEffect } from 'react'
import { ArrowUpRight, ArrowRight, Globe2, BookOpen, Sparkles, Check, Plus, Compass } from 'lucide-react'
import './landing.css'
import Link from 'next/link'
import Image from 'next/image'
import { Language, getInitialLanguage } from '@/lib/i18n'
import { StandaloneLanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { formatPostDate, stripDatePrefix } from '@/lib/feed'

const LANGUAGE_KEY = 'fomus-guild-language'

export interface LandingPost { id: string; title: string; excerpt: string; minutes: number; published_at: string }

const COPY = {
  ja: {
    login: 'ログイン', join: '無料で参加する', joinNote: '招待コード不要・クレジットカード不要',
    pillars: [
      { title: '読む。挑戦の舞台裏を知る。', desc: '枡ブランドを育てること。山梨・笛吹で地域をつなぐこと。まっすーの活動記録から、日々の出来事と学びに触れる。まずは無料記事から楽しめます。' },
      { title: '見つける。次に行きたい場所。', desc: '有料版のギルドマップで、MASU Hubと仲間を探す。旅先の拠点や、身近な街にいるメンバーのプロフィールを見つけられます。' },
      { title: 'やってみる。遊ぶように参加。', desc: 'クエストに挑戦して、ポイントを貯める。貯めたポイントで特典交換を申請。クエストや会員証のランクアップは、有料版の楽しみです。' },
    ],
    postsTitle: 'ギルドの日々を、少しだけ。', postsLead: '公開中の無料記事から。続きは無料参加後に読めます。',
    readMore: '無料で参加して続きを読む →', minutes: (m: number) => `約${m}分`,
    freeItems: ['無料公開の活動記事を読む', '過去の無料記事を月別・カテゴリ別に探す'],
    paidLead: '無料プランのすべてに加えて',
    paidItems: ['ギルドマップでメンバー・MASU Hubを探す', '公開中のメンバーの場所とプロフィールを見る', 'クエスト・ポイント交換・会員証のランクアップ', 'まっすーの有料限定記事も読む'],
    guide: '使い方ガイド', footer: '運営：FOMUS / MaSU',
  },
  en: {
    login: 'Log in', join: 'Join for free', joinNote: 'No invite or credit card needed',
    pillars: [
      { title: 'Read. Go behind the scenes.', desc: 'Building a Masu brand. Connecting people in Fuefuki, Yamanashi. Discover the daily experiences and lessons in MaSU’s journal, starting with free posts.' },
      { title: 'Explore. Find your next stop.', desc: 'Unlock the guild map with paid membership. Explore MASU Hubs and discover members who share their location and profile.' },
      { title: 'Try. Make participation playful.', desc: 'Take on quests, earn points, and request rewards. Watch your membership card rank grow. Quests and membership ranks are part of paid membership.' },
    ],
    postsTitle: 'A little glimpse of guild life.', postsLead: 'Opening excerpts from free posts. Join for free to keep reading.',
    readMore: 'Join for free to read more →', minutes: (m: number) => `${m} min`,
    freeItems: ['Read free journal posts', 'Browse free posts by month and category'],
    paidLead: 'Everything in Free, plus',
    paidItems: ['Explore members and MASU Hubs on the guild map', 'View shared member locations and profiles', 'Quests, reward exchanges, and membership ranks', 'Read MaSU’s premium posts, too'],
    guide: 'View guide', footer: 'Operated by FOMUS / MaSU',
  },
}

export function LandingClient({ posts }: { posts: LandingPost[] }) {
  const [language, setLanguage] = useState<Language>('ja')
  // Read the saved browser language after hydration; the server renders Japanese.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setLanguage(getInitialLanguage()) }, [])
  const c = COPY[language]
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem(LANGUAGE_KEY, lang)
  }

  const ja = language === 'ja'
  const [annual, setAnnual] = useState(false)
  const [japan, setJapan] = useState(true)
  const icons = [BookOpen, Globe2, Sparkles]
  const paidHref = `/auth/subscribe?plan=${annual ? 'annual' : 'monthly'}&region=${japan ? 'jp' : 'intl'}`

  return (
    <div className="landing" lang={language}>
      <header className="landing-header wrap">
        <Link href="/" className="brand"><Compass size={29} strokeWidth={1.5} /><span>FOMUS GUILD<small>CULTURE, TOGETHER.</small></span></Link>
        <nav aria-label={ja ? 'メインナビゲーション' : 'Main navigation'}>
          <a href="#guild-map">{ja ? 'ギルドマップ' : 'Guild map'}</a><a href="#membership">{ja ? '参加プラン' : 'Membership'}</a>
        </nav>
        <div className="header-actions"><StandaloneLanguageSwitcher language={language} onLanguageChange={handleLanguageChange} theme="light" /><Link href="/auth/login" className="login-link">{c.login}<ArrowUpRight size={15} /></Link></div>
      </header>
      <main>
        <section className="hero wrap">
          <div className="hero-copy">
            <p className="eyebrow"><span className="live-dot" />{ja ? '好奇心ひとつで、ようこそ。' : 'BRING YOUR CURIOSITY.'}</p>
            <h1>{ja ? <>枡から始まる、<br />世界の<span className="hero-accent">つながり。</span></> : <>A little craft.<br />A world of <span className="hero-accent">possibility.</span></>}</h1>
            <p className="hero-lead">{ja ? <>知らなかった場所。新しい仲間。やってみたいこと。<br />記事で知って、マップで見つける。枡でつながるコミュニティ。</> : 'New places. New friends. Something you want to try. Start with the stories. Discover people and places on the guild map.'}</p>
            <Link href="/auth/login" className="cta">{c.join}<ArrowUpRight size={20} /></Link>
            <p className="cta-note"><Check size={14} />{c.joinNote}</p>
            <a href="#guild-map" className="story-link">{ja ? '有料版のマップで、何ができる？' : 'What can I discover on the map?'}<ArrowRight size={16} /></a>
            <div className="hero-bottom"><span>JAPAN ↔ WORLD</span><p>{ja ? '読むだけでも、まずは大歓迎。' : 'Start by reading. You belong here, too.'}</p></div>
          </div>
          <div className="hero-visual">
            <div className="photo-label">A SMALL MASU, A BIG WORLD.</div>
            <Image src="/fomus-masu.png" alt={ja ? '緑の中に置かれた、FOMUSの木枡' : 'FOMUS wooden Masu in a green outdoor setting'} fill sizes="(max-width: 760px) 100vw, 50vw" className="hero-photo" priority />
            <div className="round-stamp">GOOD PEOPLE<br /><span>✳</span><br />GOOD ADVENTURES</div>
            <div className="photo-caption"><span>01 / THE BEGINNING</span><strong>{ja ? 'ひとつの枡が、出会いの入口に。' : 'One Masu. So many connections.'}</strong><ArrowUpRight /></div>
          </div>
        </section>
        <div className="ticker" aria-hidden="true"><span>CULTURE</span>✳<span>CONNECTION</span>✳<span>ADVENTURE</span>✳<span>FOMUS GUILD</span>✳<span>CULTURE</span>✳<span>CONNECTION</span></div>

        <section id="guild-map" className="premium-story section wrap">
          <div className="map-showcase"><p className="eyebrow">GUILD MAP / MEMBERS ONLY</p><div className="map-screen"><Image src="/screenshots/guide-map.jpg" alt={ja ? 'ギルドマップの画面例。メンバーとMASU Hubの切り替え、場所検索、地図上のピン。' : 'Guild map example showing search, member and MASU Hub filters, and location pins.'} width={1206} height={1874} sizes="(max-width: 760px) 85vw, 350px" /></div><p className="map-caption">{ja ? '画面例です。掲載場所・メンバーは変わります。' : 'Example screen. Listed locations and members may change.'}</p></div>
          <div className="story-copy"><p className="eyebrow">THE WORLD IS CLOSER THAN YOU THINK.</p><h2>{ja ? <>ただの地図が、<br />出会いの入口になる。</> : <>More than a map.<br />A place to start connecting.</>}</h2><p className="map-intro">{ja ? '有料版でひらく、FOMUS GUILDのマップ。次の旅先にも、いつもの街にも。枡でつながる人と場所を探せます。' : 'Unlock the FOMUS GUILD map with paid membership. Discover people and places connected by Masu, at home or on your next trip.'}</p><div className="story-feature"><Globe2 size={23} /><div><h3>{ja ? '行きたい街から、仲間を探す。' : 'Find people in the places you want to go.'}</h3><p>{ja ? '名前・都市・国で検索して、メンバーのピンからプロフィールへ。位置を公開している仲間が、どこにいるのか見られます。' : 'Search by name, city, or country. Open member profiles from their pins. Members appear only when they choose to share their location.'}</p></div></div><div className="story-feature"><Compass size={23} /><div><h3>{ja ? 'MASU Hubを、旅の目的地に。' : 'Make a MASU Hub your next destination.'}</h3><p>{ja ? '枡にゆかりのある店舗やスポットを地図で探索。メンバーと拠点の表示を切り替えて、自分が気になる場所を見つけられます。' : 'Explore shops and spots connected to Masu. Switch between members and Hubs to discover the places that interest you.'}</p></div></div><a href="#membership" className="cta" style={{marginTop: 28}}>{ja ? 'マップが使えるプランを見る' : 'See plans with map access'}<ArrowUpRight size={17} /></a></div>
        </section>

        <section id="experience" className="section wrap">
          <div className="section-heading"><div><p className="eyebrow">01 — EXPLORE THE GUILD</p><h2>{ja ? <>好き、から広がる。<br />ここで見つかる、次の楽しみ。</> : <>Follow your curiosity.<br />Find your next adventure.</>}</h2></div><p>{ja ? '特別なスキルも、枡の知識もいりません。\n自分のペースで、気になることから。' : 'No special skills or Masu expertise needed.\nStart with whatever interests you.'}</p></div>
          <div className="experience-grid">{c.pillars.map((p, i) => { const Icon = icons[i]; return <article className={`experience-card experience-${i}`} key={p.title}><div className="card-top"><Icon size={30} strokeWidth={1.5} /><span>0{i + 1}</span></div><h3>{p.title}</h3><p>{p.desc}</p><a href="#membership">{ja ? '参加プランを見る' : 'Explore membership'}<ArrowUpRight size={17} /></a></article> })}</div>
        </section>

        <section className="welcome wrap"><span className="welcome-symbol" aria-hidden="true">✳</span><div><p className="eyebrow">SMALL COMMUNITY, OPEN POSSIBILITIES.</p><h2>{ja ? 'まだ小さなギルド。だから、一緒につくれる。' : 'A small guild. Room for your ideas.'}</h2><p>{ja ? '完成された場所に入るより、これからの場所を一緒に育てる。記事を読む、クエストに挑戦する、気になる企画に参加する。あなたらしい関わり方を見つけてください。' : 'Help shape a community that is still growing. Read a story, try a quest, or join a project. Find your own way to be part of it.'}</p></div></section>

        {posts.length > 0 && <section className="section wrap"><div className="section-heading"><div><p className="eyebrow">FIELD NOTES</p><h2>{c.postsTitle}</h2></div><p>{c.postsLead}</p></div><div className="posts-grid">{posts.map(p => <Link href={`/auth/login?redirect=${encodeURIComponent(`/app/feed/${p.id}`)}`} className="post-card" key={p.id}><p className="post-date">{formatPostDate(p.published_at, language)} · {c.minutes(p.minutes)}</p><h3>{stripDatePrefix(p.title)}</h3><p>{p.excerpt}</p><span>{c.readMore}</span></Link>)}</div></section>}

        <section id="membership" className="membership section"><div className="wrap"><div className="section-heading"><div><p className="eyebrow">02 — FIND YOUR PLACE</p><h2>{ja ? <>まずは無料で。<br />もっと楽しみたくなったら。</> : <>Start for free.<br />Go deeper when you’re ready.</>}</h2></div><p>{ja ? '無理なく、自分に合った参加のかたちを。\n無料プランから、いつでもアップグレードできます。' : 'Choose the membership that fits you.\nUpgrade from free whenever you like.'}</p></div>
          <div className="plan-controls"><label>{ja ? 'お住まいの地域' : 'Your region'}<select value={japan ? 'jp' : 'intl'} onChange={e => setJapan(e.target.value === 'jp')}><option value="jp">{ja ? '日本 / JPY' : 'Japan / JPY'}</option><option value="intl">{ja ? '日本以外 / USD' : 'Outside Japan / USD'}</option></select></label><div className="billing-toggle"><button aria-pressed={!annual} onClick={() => setAnnual(false)}>{ja ? '月払い' : 'Monthly'}</button><button aria-pressed={annual} onClick={() => setAnnual(true)}>{ja ? '年払い · 2ヶ月分お得' : 'Annual · save 2 months'}</button></div></div>
          <div className="plans-grid"><article className="plan-card"><p className="eyebrow">FREE MEMBER</p><h3>{ja ? 'まずは、のぞいてみる。' : 'Come take a look.'}</h3><div className="price">{japan ? '¥0' : '$0'}<small>{ja ? 'ずっと無料' : 'Always free'}</small></div><p className="plan-intro">{ja ? 'まずは記事から、ギルドの日々に触れる。' : 'Start with the stories of guild life.'}</p><Link href="/auth/login" className="cta outline">{c.join}<ArrowUpRight size={19} /></Link><ul>{c.freeItems.map(item => <li key={item}><Check size={17} />{item}</li>)}</ul><p className="plan-note">{c.joinNote}</p></article>
          <article className="plan-card premium"><div className="premium-label"><Sparkles size={13} />{ja ? 'つながりを、もっと深く' : 'MAKE MORE CONNECTIONS'}</div><p className="eyebrow">GUILD MEMBER</p><h3>{ja ? 'マップを開いて、世界を広げる。' : 'Open the map. Open your world.'}</h3><div className="price">{japan ? annual ? '¥9,800' : '¥980' : annual ? '$100' : '$10'}<small>{annual ? ja ? '/ 年' : '/ year' : ja ? '/ 月' : '/ month'}</small></div><p className="plan-intro">{annual ? ja ? '年額一括払い。月払いより2ヶ月分お得。' : 'Billed annually. Save two months vs monthly.' : ja ? '月ごとのお支払い。いつでも解約できます。' : 'Billed monthly. Cancel anytime.'}</p><Link href={paidHref} className="cta">{ja ? 'このプランで参加する' : 'Join with this plan'}<ArrowUpRight size={19} /></Link><p className="includes">{c.paidLead}</p><ul>{c.paidItems.map(item => <li key={item}><Check size={17} />{item}</li>)}</ul><p className="plan-note">{ja ? 'メール認証 → プラン確認 → Stripeで決済' : 'Verify email → Review plan → Pay with Stripe'}</p></article></div>
          <p className="billing-note">{ja ? '有料プランは自動更新です。請求額・支払い方法は決済画面で確認できます。' : 'Paid plans renew automatically. Review the amount and payment methods at checkout.'}</p>
        </div></section>

        <section className="section wrap faq"><div><p className="eyebrow">A FEW THINGS TO KNOW</p><h2>{ja ? '参加の前に、ちょっとだけ。' : 'Before you jump in.'}</h2></div><div>{(ja ? [ ['枡を持っていなくても参加できますか？', 'はい。枡の知識や購入は必要ありません。日本文化や旅、人とのつながりに少しでも興味があれば、気軽に参加してください。'], ['初めてでも、ひとりでも大丈夫？', 'もちろんです。まずは記事を読むだけでも大歓迎。無料版は記事を読むだけで楽しめます。マップを使いたくなったら有料版へ進めます。'], ['無料で参加すると、料金がかかりますか？', '無料参加にクレジットカードの登録は不要です。有料プランを選び、決済を完了するまで会費はかかりません。'], ['有料プランの支払いはどうしますか？', 'メール認証後にプランを確認し、Stripeの決済画面へ進みます。利用できる支払い方法は決済画面に表示されます。'] ] : [ ['Do I need to own a Masu?', 'No purchase or expertise needed. An interest in culture, travel, or meeting people is enough.'], ['Can I join on my own?', 'Absolutely. Enjoy articles for free. Upgrade whenever you want to explore the map.'], ['Will I be charged for joining for free?', 'No card is required for free membership. You are only charged if you choose a paid plan and complete checkout.'], ['How do I pay?', 'Verify your email, review your plan, then continue to Stripe. Available payment methods are shown at checkout.'] ]).map(([q,a]) => <details key={q}><summary>{q}<Plus size={18} /></summary><p>{a}</p></details>)}</div></section>

        <section className="final-cta wrap"><p className="eyebrow">YOUR NEXT CHAPTER STARTS HERE.</p><h2>{ja ? <>次の「やってみたい」を、<br />ここで見つけよう。</> : <>Find your next<br />“let’s try it.”</>}</h2><Link href="/auth/login" className="cta">{c.join}<ArrowRight size={20} /></Link><p className="cta-note">{c.joinNote}</p></section>
      </main>
      <footer className="landing-footer wrap"><span className="brand">FOMUS GUILD</span><span>{c.footer}</span><div><Link href="/about">{ja ? 'FOMUSについて' : 'About FOMUS'}</Link><Link href="/guide">{c.guide}</Link></div></footer>
      <div className="mobile-join"><span>{ja ? '好奇心ひとつで、ようこそ。' : 'Bring your curiosity.'}</span><Link href="/auth/login">{c.join}<ArrowUpRight size={16} /></Link></div>
    </div>
  )
}
