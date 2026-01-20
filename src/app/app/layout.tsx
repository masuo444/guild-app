import { Navigation } from '@/components/ui/Navigation'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 一時的に認証不要（開発中）
  const isAdmin = true

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-zinc-50">
      <Navigation isAdmin={isAdmin} />
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}
