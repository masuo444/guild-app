import { redirect } from 'next/navigation'

// ログイン後の最初の画面はマイページ（会員証・ポイント・招待・質問箱）。記事はナビの「記事」から。
export default function AppHome() {
  redirect('/app/profile')
}
