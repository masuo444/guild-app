'use client'

import { Navigation } from '@/components/ui/Navigation'
import { PushNotificationSubscriber } from '@/components/PushNotificationSubscriber'
import { PwaInstallBanner } from '@/components/PwaInstallBanner'
import { LanguageProvider } from '@/lib/i18n'

interface AppLayoutClientProps {
  children: React.ReactNode
  isAdmin: boolean
  isSuperAdmin: boolean
}

export function AppLayoutClient({ children, isAdmin, isSuperAdmin }: AppLayoutClientProps) {
  return (
    <LanguageProvider>
      <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
        <Navigation isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} />
        <PushNotificationSubscriber />
        <PwaInstallBanner />
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
      </div>
    </LanguageProvider>
  )
}
