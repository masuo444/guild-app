import { PublicArchiveShell } from '@/components/archive/PublicArchiveShell'

/** 公開アーカイブ（ログイン不要）。アプリ内のナビは出さず、読むことに集中させる。 */
export default function PublicArchiveLayout({ children }: { children: React.ReactNode }) {
  return <PublicArchiveShell>{children}</PublicArchiveShell>
}
