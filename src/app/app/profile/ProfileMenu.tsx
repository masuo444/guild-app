'use client'

import Link from 'next/link'
import { useLanguage } from '@/lib/i18n'

interface ProfileMenuProps {
  isAdmin: boolean
}

/**
 * マイページのメニュー。下部ナビを5つに絞った分、
 * ショップ・枡の紹介・管理画面への入口をここに集約する。
 */
export function ProfileMenu({ isAdmin }: ProfileMenuProps) {
  const { t } = useLanguage()

  const items = [
    {
      href: '/app/shop',
      title: t.menuShop,
      desc: t.menuShopDesc,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    ...(isAdmin
      ? [{
          href: '/app/admin',
          title: t.menuAdmin,
          desc: t.menuAdminDesc,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        }]
      : []),
  ]

  return (
    <section className="mb-8" aria-label={t.menuTitle}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-zinc-500/30 hover:bg-white/10 hover:border-zinc-400/50 transition-colors"
          >
            <span className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-700/60 flex items-center justify-center text-[#c0c0c0]">
              {item.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-white">{item.title}</span>
              <span className="block text-xs text-zinc-400 truncate">{item.desc}</span>
            </span>
            <svg className="w-4 h-4 ml-auto text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </section>
  )
}
