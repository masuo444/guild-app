'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/lib/i18n'

/** 記事セクションの切替: 笛吹市活動記録 / 海外活動記録 / note */
export function SectionSwitch({ light = false }: { light?: boolean }) {
  const { language } = useLanguage()
  const ja = language === 'ja'
  const pathname = usePathname()
  const items = [
    { href: '/app/feed', label: ja ? '笛吹市活動記録' : 'Fuefuki Journal', active: pathname.startsWith('/app/feed') },
    { href: '/app/archive', label: ja ? '海外活動記録' : 'Overseas Archive', active: pathname.startsWith('/app/archive') && !pathname.startsWith('/app/archive/note') },
    { href: '/app/archive/note', label: 'note', active: pathname.startsWith('/app/archive/note') },
  ]
  return (
    <div className={`flex gap-1 p-1 rounded-xl mb-5 ${light ? 'bg-zinc-100' : 'bg-white/5'}`}>
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className={`flex-1 text-center px-2 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
            it.active ? 'bg-[#c0c0c0] text-zinc-900' : light ? 'text-zinc-600 hover:bg-zinc-200' : 'text-zinc-300 hover:bg-white/10'
          }`}
        >
          {it.label}
        </Link>
      ))}
    </div>
  )
}
