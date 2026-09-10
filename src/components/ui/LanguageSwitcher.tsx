'use client'

import { Globe } from 'lucide-react'
import { Language, useLanguage } from '@/lib/i18n'

type Variant = 'default' | 'compact'
type Theme = 'dark' | 'light'

interface BaseProps {
  language: Language
  onLanguageChange: (lang: Language) => void
  className?: string
  variant?: Variant
  theme?: Theme
}

/**
 * 共通の言語切替UI（どのページでも同じ見た目）。
 * default: [🌐 日本語 | EN] のピル。compact: 反対側の言語だけを出す小さなボタン。
 */
function SwitcherView({ language, onLanguageChange, className = '', variant = 'default', theme = 'dark' }: BaseProps) {
  const isDark = theme === 'dark'
  const label = language === 'ja' ? '言語を切り替える' : 'Switch language'

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={() => onLanguageChange(language === 'ja' ? 'en' : 'ja')}
        aria-label={label}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
          isDark
            ? 'border-zinc-500/40 bg-white/10 text-zinc-100 hover:bg-white/20'
            : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
        } ${className}`}
      >
        <Globe size={13} strokeWidth={2} aria-hidden="true" />
        {language === 'ja' ? 'EN' : '日本語'}
      </button>
    )
  }

  const seg = (active: boolean) =>
    `px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${
      active
        ? isDark ? 'bg-white text-zinc-900' : 'bg-stone-900 text-white'
        : isDark ? 'text-zinc-300 hover:text-white' : 'text-stone-500 hover:text-stone-900'
    }`

  return (
    <div
      role="group"
      aria-label={label}
      className={`inline-flex items-center gap-0.5 rounded-full border p-0.5 ${
        isDark ? 'border-zinc-500/40 bg-white/10' : 'border-stone-300 bg-white'
      } ${className}`}
    >
      <Globe size={13} strokeWidth={2} aria-hidden="true" className={`ml-1.5 mr-0.5 ${isDark ? 'text-zinc-300' : 'text-stone-500'}`} />
      <button type="button" onClick={() => onLanguageChange('ja')} aria-pressed={language === 'ja'} className={seg(language === 'ja')} lang="ja">
        日本語
      </button>
      <button type="button" onClick={() => onLanguageChange('en')} aria-pressed={language === 'en'} className={seg(language === 'en')} lang="en">
        EN
      </button>
    </div>
  )
}

interface LanguageSwitcherProps {
  className?: string
  variant?: Variant
  theme?: Theme
}

/** LanguageProvider 配下で使う版（/app 内・ログイン後のページ） */
export function LanguageSwitcher({ className = '', variant = 'default', theme = 'dark' }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage()
  return <SwitcherView language={language} onLanguageChange={setLanguage} className={className} variant={variant} theme={theme} />
}

/** Provider なしで使う版（トップ・ログイン・招待・ガイドなど、各ページが state を持つ場合） */
export function StandaloneLanguageSwitcher(props: BaseProps) {
  return <SwitcherView {...props} />
}
