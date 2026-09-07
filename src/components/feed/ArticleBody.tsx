import { parseArticle } from '@/lib/feed'

/**
 * 活動記録の本文を「読み物」として描画する。
 * 見出し・学びカード・段落・結びを分け、行間と文字幅を読書向けに揃える。
 */
export function ArticleBody({ body, light }: { body: string; light: boolean }) {
  const blocks = parseArticle(body)
  const text = light ? 'text-zinc-800' : 'text-zinc-200'
  const muted = light ? 'text-zinc-500' : 'text-zinc-500'
  const heading = light ? 'text-zinc-900' : 'text-white'

  return (
    <div className={`text-[15px] md:text-base leading-[1.95] tracking-[0.01em] ${text}`}>
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'date':
            return <p key={i} className={`text-xs tracking-widest mb-6 ${muted}`}>{b.text}</p>
          case 'heading':
            return (
              <h2
                key={i}
                className={`text-lg md:text-xl font-bold leading-snug mt-10 mb-4 pl-3 border-l-4 ${light ? 'border-amber-400' : 'border-[#c0c0c0]/70'} ${heading}`}
              >
                {b.text}
              </h2>
            )
          case 'learning':
            return (
              <aside
                key={i}
                className={`my-6 rounded-xl px-4 py-3.5 border ${
                  light ? 'bg-amber-50 border-amber-200 text-amber-950' : 'bg-amber-500/10 border-amber-500/25 text-amber-100'
                }`}
              >
                <p className={`text-[11px] font-semibold tracking-widest mb-1 ${light ? 'text-amber-700' : 'text-amber-300'}`}>💡 学び</p>
                <p className="text-sm md:text-[15px] leading-relaxed">{b.text}</p>
              </aside>
            )
          case 'closing':
            return <p key={i} className={`mt-10 text-sm ${muted}`}>{b.text}</p>
          case 'paragraph':
            return (
              <p key={i} className="mb-5">
                {b.lines.map((l, j) => (
                  <span key={j}>
                    {l}
                    {j < b.lines.length - 1 && <br />}
                  </span>
                ))}
              </p>
            )
        }
      })}
    </div>
  )
}
