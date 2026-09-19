import type { Metadata } from 'next'
import { getPublicRegionSummaries, getPublicArticles } from '@/lib/archive'
import { ArchiveHome } from '@/components/archive/ArchiveHome'
import { PublicArchiveCta } from '@/components/archive/PublicArchiveCta'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://guild.fomus.jp'

export const metadata: Metadata = {
  title: '海外活動記録 — 枡を持って世界を歩いた記録',
  description:
    'FOMUS代表まっすーが、枡を持ってセブ島・マレーシア・アイルランド・ヨーロッパ・中東・シンガポール・台湾を歩いた活動記録。現地で日本文化をどう伝えたかを日英で綴っています。',
  alternates: { canonical: `${APP_URL}/archive` },
  openGraph: {
    title: '海外活動記録 — 枡を持って世界を歩いた記録',
    description: 'セブ島からヨーロッパ、中東まで。枡を持って世界を歩いた記録を日英で公開しています。',
    url: `${APP_URL}/archive`,
    type: 'website',
  },
}

/** ログイン不要の公開アーカイブ。検索からの入口。 */
export default function PublicArchivePage() {
  return (
    <>
      <ArchiveHome regions={getPublicRegionSummaries()} total={getPublicArticles().length} basePath="/archive" />
      <PublicArchiveCta />
    </>
  )
}
