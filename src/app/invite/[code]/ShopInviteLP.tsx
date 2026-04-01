'use client'

import { Button } from '@/components/ui/Button'

interface Props {
  onProceedToPayment: () => void
  loading: boolean
  error: string
  canceled: boolean
}

export default function ShopInviteLP({ onProceedToPayment, loading, error, canceled }: Props) {
  return (
    <div className="min-h-screen bg-[#02120a] text-[#f0fdf4] overflow-x-hidden">
      {/* Hero */}
      <section className="relative min-h-[70vh] flex flex-col justify-center items-center text-center px-6 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="w-12 h-12 border border-emerald-500/30 rotate-45 mx-auto mb-8 flex items-center justify-center">
            <div className="w-6 h-6 bg-emerald-500/20 rotate-0" />
          </div>
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-light tracking-wide leading-tight">
            FOMUS GUILD
          </h1>
          <p className="text-base md:text-lg text-white/70 leading-relaxed max-w-md mx-auto">
            月980円で参加できる。<br />
            日本の文化とプロジェクトに、<br className="md:hidden" />
            世界から関われるコミュニティ。
          </p>
          <div className="flex flex-col items-center gap-2 pt-8">
            <span className="text-[10px] tracking-[0.3em] text-emerald-500/60 uppercase">Scroll</span>
            <div className="w-px h-12 bg-gradient-to-b from-emerald-500/60 to-transparent" />
          </div>
        </div>
      </section>

      {/* Definition */}
      <section className="py-20 md:py-28 px-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="font-serif text-3xl md:text-5xl leading-tight mb-4">
              Consumer to<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-lime-300 italic font-light">Co-creator.</span>
            </h2>
            <p className="text-sm tracking-wider text-white/40 flex items-center gap-3">
              <span className="w-8 h-px bg-emerald-500/50" /> 消費者から、共創者へ。
            </p>
          </div>
          <div className="space-y-6 text-white/80 leading-relaxed">
            <p>
              FOMUS GUILDは、日本の文化やプロジェクトに
              <strong className="text-emerald-400 font-normal border-b border-emerald-500/30">「参加する側」</strong>として関われるグローバルコミュニティです。
            </p>
            <p className="text-sm text-white/60">
              完成したコンテンツを見るだけではなく、制作・企画・運営・発信など、プロジェクトの一部として関わることができます。
            </p>
          </div>
        </div>
      </section>

      {/* Experience Cards */}
      <section className="py-20 bg-[#052e16]/40 border-y border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs text-emerald-400 tracking-[0.2em] uppercase font-bold mb-3">What you can do</p>
            <h3 className="font-serif text-2xl md:text-3xl">ここで体験できること</h3>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {[
              {
                num: '01',
                title: '枡を「所有」せず、必要なときに体験する',
                desc: 'FOMUSの象徴であるアート枡「MASU」を、世界中のイベントや活動の場で体験できます。自分で所有する必要はありません。',
              },
              {
                num: '02',
                title: '世界のどこかに、仲間がいる',
                desc: '専用のメンバーMAPで、世界のどの街に仲間がいるかが分かります。旅先で出会ったり、イベントに参加したり。',
              },
              {
                num: '03',
                title: 'プロジェクトに、当事者として関わる',
                desc: 'FOMUSのプロジェクトに、「見る側」ではなく「関わる側」として参加できます。制作、イベント、翻訳、企画など。',
              },
            ].map((card) => (
              <div
                key={card.num}
                className="relative bg-[#052e16]/30 backdrop-blur border border-white/5 p-6 md:p-8 rounded hover:border-emerald-500/40 hover:bg-[#052e16]/60 transition-all duration-300 group"
              >
                <span className="absolute top-4 right-4 text-white/5 text-4xl font-serif group-hover:text-emerald-500/10 transition-colors">{card.num}</span>
                <h4 className="font-serif text-lg mb-3 group-hover:text-emerald-300 transition-colors">{card.title}</h4>
                <p className="text-sm text-white/50 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MASU POINT */}
      <section className="py-20 px-6 bg-[#052e16]/20 border-b border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-emerald-400 tracking-[0.3em] uppercase mb-3">Participation has value.</p>
          <h3 className="font-serif text-2xl md:text-3xl mb-6">関わることが、次につながる。</h3>
          <div className="text-sm text-white/70 leading-loose space-y-4">
            <p>
              FOMUS GUILDでは、イベント参加、企画協力、制作サポートなど、あなたの関わり一つひとつが記録されていきます。
              この記録を、私たちは「MASU POINT」と呼んでいます。
            </p>
            <ul className="space-y-2 text-white/50">
              <li>・参加できるプロジェクトが増える</li>
              <li>・イベントや企画を"主催する側"になれる</li>
              <li>・FOMUSの公式活動に関われるようになる</li>
            </ul>
            <p className="text-white/50 text-xs">
              貯まったMASU POINTは、GUILD内のアイテムや特典と交換することもできます。
            </p>
          </div>
        </div>
      </section>

      {/* Membership CTA */}
      <section className="py-20 md:py-28 px-6 relative overflow-hidden" id="join">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto border border-emerald-500/30 p-8 md:p-12 relative bg-gradient-to-b from-[#02120a]/70 via-[#052e16]/40 to-[#02120a]/80 backdrop-blur">
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-5 h-5 border-t border-l border-emerald-500" />
          <div className="absolute top-0 right-0 w-5 h-5 border-t border-r border-emerald-500" />
          <div className="absolute bottom-0 left-0 w-5 h-5 border-b border-l border-emerald-500" />
          <div className="absolute bottom-0 right-0 w-5 h-5 border-b border-r border-emerald-500" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-px bg-emerald-500/60" />
                <span className="text-xs text-white/40 tracking-[0.25em] uppercase">メンバーシップ</span>
              </div>
              <p className="text-base text-white/80 leading-relaxed mb-6">
                FOMUS GUILDは、世界とつながりながら、日本の文化づくりに関われる場所です。
              </p>
              <ul className="text-sm text-white/70 space-y-3">
                {[
                  '世界中のFOMUSメンバーとつながる',
                  'FOMUSのプロジェクトに関わる',
                  '特殊なアート枡を、必要な場面で利用できる',
                  '関わりが記録され、できることが広がっていく',
                  'FOMUS Shopの対象商品を会員限定価格で購入',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 w-5 h-5 rounded-full border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-[10px] shrink-0">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-white/10 bg-gradient-to-b from-[#02120a]/60 to-[#052e16]/40 p-6 md:p-8 backdrop-blur relative overflow-hidden">
              <div className="absolute -top-16 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-[70px]" />
              <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-emerald-500/60 via-transparent to-transparent" />

              <div className="relative">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <p className="text-[11px] text-emerald-400 tracking-[0.3em] uppercase">Investment for Culture</p>
                </div>
                <p className="text-sm text-white/70 mb-3">この場所への参加は、</p>
                <div className="flex items-baseline gap-2 mb-5">
                  <span className="font-serif text-3xl text-emerald-400">980円</span>
                  <span className="text-xs text-white/40">/ 月（税込）</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/40 mb-6">
                  <span className="w-8 h-px bg-emerald-500/40" />
                  <span>Cancel anytime</span>
                </div>

                {canceled && (
                  <div className="mb-4 p-3 bg-amber-900/30 border border-amber-500/30 rounded text-amber-300 text-sm text-center">
                    決済がキャンセルされました。再度お試しください。
                  </div>
                )}

                {error && (
                  <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded text-red-300 text-sm text-center">
                    {error}
                  </div>
                )}

                <button
                  onClick={onProceedToPayment}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 text-[#02120a] font-bold py-4 px-6 tracking-wider rounded-sm hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] transition-all disabled:opacity-50"
                >
                  {loading ? '処理中...' : 'FOMUS GUILDに参加する'}
                </button>
                <p className="text-[10px] text-white/30 mt-3 tracking-wider text-center">No hidden fees</p>
              </div>
            </div>
          </div>
        </div>

        {/* Already a member */}
        <div className="text-center mt-8">
          <a
            href="/auth/login"
            className="text-sm text-white/40 hover:text-white/70 underline underline-offset-4 transition-colors"
          >
            既にGUILD会員の方はログイン
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-[10px] text-white/20 border-t border-white/5">
        <p>&copy; FOMUS GUILD. Quiet. Warm. Continuous.</p>
      </footer>
    </div>
  )
}
