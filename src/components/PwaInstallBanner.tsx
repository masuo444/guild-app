'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '@/lib/i18n'
import { X, Share, Plus, ChevronDown, ChevronUp, Download, Smartphone } from 'lucide-react'

const DISMISS_KEY = 'fomus-guild-pwa-install-dismissed'
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS|Chrome/.test(ua)
  return isIos && isSafari
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function isDismissed(): boolean {
  if (typeof localStorage === 'undefined') return false
  const dismissed = localStorage.getItem(DISMISS_KEY)
  if (!dismissed) return false
  const dismissedAt = parseInt(dismissed, 10)
  if (Date.now() - dismissedAt < DISMISS_DURATION) return true
  localStorage.removeItem(DISMISS_KEY)
  return false
}

export function PwaInstallBanner() {
  const { t } = useLanguage()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showIosSteps, setShowIosSteps] = useState(false)

  useEffect(() => {
    if (isStandalone() || isDismissed()) return

    if (isIosSafari()) {
      setIsIos(true)
      setShowBanner(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
    setShowBanner(false)
  }, [])

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
  }, [deferredPrompt])

  if (!showBanner) return null

  return (
    <div className="fixed z-40 bottom-20 left-2 right-2 md:bottom-4 md:left-auto md:right-4 md:max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl p-4">
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 pr-6">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-zinc-100">
              {t.pwaInstallTitle}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {t.pwaInstallDescription}
            </p>
          </div>
        </div>

        {/* Notification note */}
        <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" />
          {t.pwaInstallNotificationNote}
        </p>

        {/* iOS Steps */}
        {isIos && showIosSteps && (
          <div className="mt-3 space-y-2 bg-zinc-900/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-zinc-700 rounded-full flex items-center justify-center text-xs text-zinc-300">1</span>
              <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                <Share className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span>{t.pwaIosStep1}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-zinc-700 rounded-full flex items-center justify-center text-xs text-zinc-300">2</span>
              <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                <Plus className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                <span>{t.pwaIosStep2}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-zinc-700 rounded-full flex items-center justify-center text-xs text-zinc-300">3</span>
              <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                <Download className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                <span>{t.pwaIosStep3}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          {isIos ? (
            <button
              onClick={() => setShowIosSteps(!showIosSteps)}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {t.pwaInstallHowTo}
              {showIosSteps ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <button
              onClick={handleInstall}
              className="flex-1 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {t.pwaInstallButton}
            </button>
          )}
          <button
            onClick={dismiss}
            className="px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {t.pwaInstallLater}
          </button>
        </div>
      </div>
    </div>
  )
}
