import { redirect } from 'next/navigation'

// ログイン機能は一時的に無効化
// アプリに直接リダイレクト
export default function LoginPage() {
  redirect('/app')
}
