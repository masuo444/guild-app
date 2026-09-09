import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'
import { makeTeaser, stripDatePrefix } from '@/lib/feed'

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/**
 * 新しい記事を全会員にメールで知らせる。
 * 本文は「冒頭〜最初の見出し」のプレビューだけ載せ、続きはアプリで読んでもらう
 * （有料会員は全文、無料会員はプレビュー＋メンバー案内が記事ページで出る）。
 * 言語は profiles.language で JA/EN のヘッダー・ボタン文言だけ切り替える（本文は日本語のまま）。
 */
export async function sendNewPostEmail(post: { id: string; title: string; body: string; title_en?: string | null; body_en?: string | null }): Promise<{ sent: number; failed: number }> {
  if (!process.env.RESEND_API_KEY) return { sent: 0, failed: 0 }
  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://guild-app.fomusglobal.com'
  const service = createServiceClient()

  const { data: profiles } = await service.from('profiles').select('id, language')
  const langMap: Record<string, 'ja' | 'en'> = {}
  for (const p of profiles ?? []) langMap[p.id] = p.language === 'en' ? 'en' : 'ja'

  const users: { id: string; email?: string }[] = []
  let page = 1
  while (true) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 1000 })
    if (error || !data.users.length) break
    users.push(...data.users)
    if (data.users.length < 1000) break
    page++
  }

  const url = `${appUrl}/app/feed/${post.id}`

  const html = (lang: 'ja' | 'en') => {
    const title = lang === 'en' && post.title_en ? post.title_en : stripDatePrefix(post.title)
    const teaser = makeTeaser(lang === 'en' && post.body_en ? post.body_en : post.body)
    const cta = lang === 'en' ? 'Read the full post' : '続きを読む'
    const intro = lang === 'en' ? 'A new post from MaSU' : 'まっすーの新しい記事が届きました'
    const footer = lang === 'en'
      ? 'You are receiving this because you are a FOMUS GUILD member.'
      : 'このメールは FOMUS GUILD 会員の方にお送りしています。'
    const bodyHtml = escapeHtml(teaser).replace(/\n/g, '<br/>')
    return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${escapeHtml(title)}</title></head>
<body style="margin:0; padding:0; background-color:#f4f4f3;">
<div style="display:none; max-height:0; overflow:hidden; opacity:0;">${escapeHtml(teaser).slice(0, 100)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f3; padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:480px; background-color:#ffffff; border-radius:16px; overflow:hidden;" cellpadding="0" cellspacing="0">
<tr><td style="background-color:#1c1917; padding:20px 24px;"><p style="margin:0; font-size:12px; letter-spacing:3px; color:#c0c0c0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">FOMUS GUILD</p></td></tr>
<tr><td style="padding:28px 24px 0 24px;">
<p style="margin:0 0 8px 0; font-size:12px; color:#8a6d1f; letter-spacing:1px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${intro}</p>
<h1 style="margin:0 0 18px 0; font-size:20px; line-height:1.5; color:#1c1917; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Hiragino Sans',sans-serif;">${escapeHtml(title)}</h1>
<div style="font-size:16px; line-height:1.85; color:#262220; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Hiragino Sans',sans-serif; word-break:break-word;">${bodyHtml}</div>
<p style="margin:14px 0 0 0; color:#999; font-size:13px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">…</p>
</td></tr>
<tr><td style="padding:24px 24px 8px 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="border-radius:9999px; background-color:#1c1917;"><a href="${url}" style="display:block; width:100%; box-sizing:border-box; padding:16px 24px; color:#ffffff; text-decoration:none; font-size:16px; font-weight:600; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; text-align:center;">${cta}</a></td></tr></table></td></tr>
<tr><td style="padding:24px 24px 28px 24px;"><hr style="border:none; border-top:1px solid #eee; margin:0 0 16px 0;" /><p style="margin:0; color:#999; font-size:12px; line-height:1.6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${footer}</p></td></tr>
</table></td></tr></table></body></html>`
  }
  const htmlJa = html('ja'), htmlEn = html('en')

  const results = await Promise.allSettled(
    users.filter((u) => u.email).map(async (u) => {
      const lang = langMap[u.id] || 'ja'
      const subjectTitle = lang === 'en' && post.title_en ? post.title_en : stripDatePrefix(post.title)
      const { error } = await resend.emails.send({
        from: fromEmail,
        to: u.email!,
        subject: `[FOMUS GUILD] ${subjectTitle}`,
        html: lang === 'en' ? htmlEn : htmlJa,
      })
      if (error) throw error
    })
  )
  const sent = results.filter((r) => r.status === 'fulfilled').length
  return { sent, failed: results.length - sent }
}
