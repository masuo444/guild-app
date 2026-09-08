import { redirect } from 'next/navigation'

// ホームは「記事」。会員証・ポイント・招待はマイページに集約。
export default function AppHome() {
  redirect('/app/feed')
}
