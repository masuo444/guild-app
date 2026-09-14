import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ADMIN_EMAILS } from '@/lib/access'
import { translateJaToEn } from '@/lib/translate'
import { translateNewsletter } from '@/lib/translate-newsletter'

// Claude翻訳は数十秒かかることがあるので実行時間上限を延ばす
export const maxDuration = 60

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

type MailLang = 'ja' | 'en'

const JP_COUNTRY = /日本|japan|nippon|nihon|^jp$/i

/**
 * 本人の言語設定を最優先。未設定なら国から推測する。
 * 国も未設定なら英語。会員の大半が海外在住で、日英併記は双方にとって読みにくいため
 * （英語で届いた日本の会員には、フッターの一行で切り替え方を案内する）。
 */
export function resolveMailLang(language?: string | null, homeCountry?: string | null): MailLang {
  if (language === 'en') return 'en'
  if (language === 'ja') return 'ja'
  const c = (homeCountry ?? '').trim()
  if (!c) return 'en'
  return JP_COUNTRY.test(c) ? 'ja' : 'en'
}

function buildEmailHtml(body: string, lang: 'ja' | 'en', subject: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://guild.fomusglobal.com'
  // 本文中のURLをタップしやすいリンクに変換してからHTMLエスケープ・改行を反映
  // （プレーンテキストのメール本文にURLを書くだけで、モバイルメーラーの自動リンク化に頼らず確実にタップできるようにする）
  const escaped = escapeHtml(body)
  const linked = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    (url) => `<a href="${url}" style="color:#8a6d1f; text-decoration:underline;">${url}</a>`
  )
  const bodyHtml = linked.replace(/\n/g, '<br/>')
  const cta = lang === 'en' ? 'Open FOMUS GUILD' : 'FOMUS GUILDを開く'
  const footer = lang === 'en'
    ? 'You are receiving this because you are a FOMUS GUILD member.'
    : 'このメールは FOMUS GUILD 会員の方にお送りしています。'
  // 言語未設定の会員には英語で送るため、日本語の方が読みやすい人向けに切替案内を添える
  const langSwitchNote = lang === 'en'
    ? '日本語で受け取りたい方は、アプリを開いて画面右上の言語切替を「日本語」にしてください。次回から日本語で届きます。'
    : ''
  const preheader = escapeHtml(body).slice(0, 100)

  // モバイルメーラー(Gmail/Apple Mail等)で単一カラム・大きめタップ領域になるよう
  // フル文書構造+viewportメタ+インラインCSSで構成。デスクトップでもmax-widthで見やすい。
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f3; -webkit-text-size-adjust:100%; text-size-adjust:100%;">
  <!-- プリヘッダー: 受信トレイのプレビューに出る要約テキスト（本文には表示されない） -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${preheader}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f3; padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:480px; background-color:#ffffff; border-radius:16px; overflow:hidden;" cellpadding="0" cellspacing="0">

          <!-- ヘッダー -->
          <tr>
            <td style="background-color:#1c1917; padding:20px 24px;">
              <p style="margin:0; font-size:12px; letter-spacing:3px; color:#c0c0c0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">FOMUS GUILD</p>
            </td>
          </tr>

          <!-- 本文 -->
          <tr>
            <td style="padding:28px 24px 8px 24px;">
              <div style="font-size:17px; line-height:1.85; color:#262220; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Hiragino Sans',sans-serif; word-break:break-word;">${bodyHtml}</div>
            </td>
          </tr>

          <!-- CTAボタン（スマホでタップしやすいよう横幅いっぱい・高さ確保） -->
          <tr>
            <td style="padding:24px 24px 8px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="border-radius:9999px; background-color:#1c1917;">
                    <a href="${appUrl}/app" style="display:block; width:100%; box-sizing:border-box; padding:16px 24px; color:#ffffff; text-decoration:none; font-size:16px; font-weight:600; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; text-align:center;">${cta}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- フッター -->
          <tr>
            <td style="padding:24px 24px 28px 24px;">
              <hr style="border:none; border-top:1px solid #eee; margin:0 0 16px 0;" />
              <p style="margin:0; color:#999; font-size:12px; line-height:1.6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${footer}</p>
              ${langSwitchNote ? `<p style="margin:8px 0 0 0; color:#999; font-size:12px; line-height:1.6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Hiragino Sans',sans-serif;">${langSwitchNote}</p>` : ''}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function POST(request: NextRequest) {
  // 管理者認証
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin' || ADMIN_EMAILS.includes(user.email as typeof ADMIN_EMAILS[number])
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const {
    subject, body: message, test = false,
    subjectEn: subjectEnInput, bodyEn: bodyEnInput,
  } = body as {
    subject?: string; body?: string; test?: boolean
    subjectEn?: string; bodyEn?: string
  }
  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'subject and body are required' }, { status: 400 })
  }

  // 英語版。管理画面で英文を渡された場合はそれを使い、無ければ自動翻訳する。
  // （手書き・手直しした英文が最優先。自動翻訳より人の判断を信用する）
  let subjectEn = subjectEnInput?.trim() || subject
  let messageEn = bodyEnInput?.trim() || message
  if (!subjectEnInput?.trim() || !bodyEnInput?.trim()) {
    // Claude で件名と本文をまとめて翻訳する（文脈が揃うので語調・固有名詞がブレない）。
    // 鍵が無い・失敗した場合だけ、旧来の機械翻訳にフォールバックする。
    let translated = false
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const t = await translateNewsletter({ subject, body: message })
        if (!subjectEnInput?.trim()) subjectEn = t.subject_en
        if (!bodyEnInput?.trim()) messageEn = t.body_en
        translated = true
      } catch (e) {
        console.error('Newsletter Claude translation error:', e)
      }
    }
    if (!translated) {
      try {
        if (!subjectEnInput?.trim()) subjectEn = await translateJaToEn(subject)
        if (!bodyEnInput?.trim()) messageEn = await translateJaToEn(message)
      } catch (e) {
        console.error('Newsletter fallback translation error:', e)
        // 翻訳失敗時は日本語のまま送る（送信自体は継続）
      }
    }
  }

  const service = createServiceClient()

  // 言語マップ（profiles）
  // language 未設定の会員が多いため、国から推測する。
  // 日本 → 日本語、それ以外の国 → 英語、国も未設定 → 英語。
  const { data: profiles } = await service.from('profiles').select('id, language, home_country')
  const langMap: Record<string, MailLang> = {}
  for (const p of profiles ?? []) langMap[p.id] = resolveMailLang(p.language, p.home_country)

  // 全ユーザーのメール（auth）をページネーションで取得
  type AuthUser = { id: string; email?: string }
  const allUsers: AuthUser[] = []
  let page = 1
  while (true) {
    const { data: { users }, error } = await service.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) break
    if (!users.length) break
    allUsers.push(...users)
    if (users.length < 1000) break
    page++
  }

  // テスト送信は管理者本人のみ
  const targets = test ? allUsers.filter(u => u.id === user.id) : allUsers

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

  let emailSent = 0, emailFailed = 0
  let emailErrors: string[] = []
  if (resend) {
    const results = await Promise.allSettled(targets.filter(u => u.email).map(async (u) => {
      const lang = langMap[u.id] || 'en'
      const subj = lang === 'en' ? subjectEn : subject
      const text = lang === 'en' ? messageEn : message
      const html = buildEmailHtml(text, lang, subj)
      const { error } = await resend.emails.send({ from: fromEmail, to: u.email!, subject: `[FOMUS GUILD] ${subj}`, html })
      if (error) throw error
    }))
    emailSent = results.filter(r => r.status === 'fulfilled').length
    emailFailed = results.length - emailSent
    emailErrors = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r) => (r.reason instanceof Error ? r.reason.message : JSON.stringify(r.reason)))
  } else if (!process.env.RESEND_API_KEY) {
    emailErrors = ['RESEND_API_KEY is not configured']
  }

  return NextResponse.json({ success: true, test, emailSent, emailFailed, emailErrors, subjectEn })
}
