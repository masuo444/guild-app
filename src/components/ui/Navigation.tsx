'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  ariaLabel: string
}

export function Navigation({ isAdmin = false, isSuperAdmin = false, readerOnly = false }: { isAdmin?: boolean; isSuperAdmin?: boolean; readerOnly?: boolean }) {
  const pathname = usePathname()
  const { t, language } = useLanguage()

  const localizedNavItems: NavItem[] = [
    {
      label: language === 'ja' ? '記事' : 'Journal',
      href: '/app/feed',
      ariaLabel: "Go to MaSU's Journal",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m0 0h2a1 1 0 011 1v11a2 2 0 01-2 2h0m-3-3V8m-9 4h4m-4 4h4m-4-8h4" />
        </svg>
      ),
    },
    {
      label: t.map,
      href: '/app/map',
      ariaLabel: 'Go to Guild Map',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
    },
    {
      // 会員証・ショップ・招待・設定はマイページ内
      label: t.navMyPage,
      href: '/app/profile',
      ariaLabel: 'Go to My Page',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ]

  const allItems = readerOnly
    ? localizedNavItems.filter(item => ['/app/feed', '/app/map', '/app/profile'].includes(item.href)).map(item => item.href === '/app/map' ? { ...item, href: '/auth/subscribe', label: language === 'ja' ? 'マップを解放' : 'Unlock map' } : item)
    : [...localizedNavItems]

  if (isAdmin) {
    allItems.push({
      label: t.admin,
      href: '/app/admin',
      ariaLabel: 'Go to Admin Panel',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    })
  }

  if (isSuperAdmin) {
    allItems.push({
      label: t.superAdmin,
      href: '/app/super-admin',
      ariaLabel: 'Go to Super Admin Panel',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    })
  }

  return (
    <nav data-bottom-nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900/80 backdrop-blur border-t border-zinc-500/30 md:static md:border-t-0 md:border-r md:w-64 md:min-h-screen" aria-label="Main navigation">
      {/* ロゴ（デスクトップのみ） */}
      <div className="hidden md:block p-6 border-b border-zinc-500/30">
        <h1 className="text-xl font-bold text-white">FOMUS GUILD</h1>
      </div>

      {/* ナビゲーションリンク */}
      <ul className="flex justify-around md:flex-col md:p-4 md:gap-1 list-none m-0 p-0" role="menubar">
        {allItems.map((item) => {
          const isActive =
            item.href === '/app/profile'
              ? ['/app/profile', '/app/shop'].some((p) => pathname.startsWith(p))
              : pathname.startsWith(item.href)

          const isExternal = item.href.startsWith('/api/')
          const LinkComponent = isExternal ? 'a' : Link

          return (
            <li key={item.href} role="none">
              <LinkComponent
                href={item.href}
                role="menuitem"
                aria-label={item.ariaLabel}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex flex-col md:flex-row items-center gap-1 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-lg transition-colors touch-manipulation',
                  isActive
                    ? 'text-white bg-zinc-500/30'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-500/20'
                )}
              >
                {item.icon}
                <span className="text-xs md:text-sm font-medium">{item.label}</span>
              </LinkComponent>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
