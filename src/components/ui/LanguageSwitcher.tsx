'use client'

import { Language, useLanguage } from '@/lib/i18n'

interface LanguageSwitcherProps {
  className?: string
  variant?: 'default' | 'compact'
  theme?: 'dark' | 'light'
}

export function LanguageSwitcher({ className = '', variant = 'default', theme = 'dark' }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage()

  const handleChange = (lang: Language) => {
    setLanguage(lang)
  }

  const isDark = theme === 'dark'

  if (variant === 'compact') {
    return (
      <button
        onClick={() => handleChange(language === 'ja' ? 'en' : 'ja')}
        className={`px-2 py-1 text-sm font-medium rounded transition-colors ${
          isDark ? 'hover:bg-white/10' : 'hover:bg-stone-200'
        } ${className}`}
      >
        {language === 'ja' ? 'EN' : 'JP'}
      </button>
    )
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        onClick={() => handleChange('ja')}
        className={`px-2 py-1 text-sm font-medium rounded transition-colors ${
          language === 'ja'
            ? isDark ? 'bg-white/20 text-white' : 'bg-stone-800 text-white'
            : isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-stone-400 hover:text-stone-800 hover:bg-stone-200'
        }`}
      >
        JP
      </button>
      <span className={isDark ? 'text-zinc-600' : 'text-stone-300'}>/</span>
      <button
        onClick={() => handleChange('en')}
        className={`px-2 py-1 text-sm font-medium rounded transition-colors ${
          language === 'en'
            ? isDark ? 'bg-white/20 text-white' : 'bg-stone-800 text-white'
            : isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-stone-400 hover:text-stone-800 hover:bg-stone-200'
        }`}
      >
        EN
      </button>
    </div>
  )
}

// Standalone version without context (for pages without LanguageProvider)
interface StandaloneLanguageSwitcherProps {
  language: Language
  onLanguageChange: (lang: Language) => void
  className?: string
  variant?: 'default' | 'compact'
  theme?: 'dark' | 'light'
}

export function StandaloneLanguageSwitcher({
  language,
  onLanguageChange,
  className = '',
  variant = 'default',
  theme = 'dark',
}: StandaloneLanguageSwitcherProps) {
  const isDark = theme === 'dark'

  if (variant === 'compact') {
    return (
      <button
        onClick={() => onLanguageChange(language === 'ja' ? 'en' : 'ja')}
        className={`px-2 py-1 text-sm font-medium rounded transition-colors ${
          isDark ? 'hover:bg-white/10' : 'hover:bg-stone-200'
        } ${className}`}
      >
        {language === 'ja' ? 'EN' : 'JP'}
      </button>
    )
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        onClick={() => onLanguageChange('ja')}
        className={`px-2 py-1 text-sm font-medium rounded transition-colors ${
          language === 'ja'
            ? isDark ? 'bg-white/20 text-white' : 'bg-stone-800 text-white'
            : isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-stone-400 hover:text-stone-800 hover:bg-stone-200'
        }`}
      >
        JP
      </button>
      <span className={isDark ? 'text-zinc-600' : 'text-stone-300'}>/</span>
      <button
        onClick={() => onLanguageChange('en')}
        className={`px-2 py-1 text-sm font-medium rounded transition-colors ${
          language === 'en'
            ? isDark ? 'bg-white/20 text-white' : 'bg-stone-800 text-white'
            : isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-stone-400 hover:text-stone-800 hover:bg-stone-200'
        }`}
      >
        EN
      </button>
    </div>
  )
}
