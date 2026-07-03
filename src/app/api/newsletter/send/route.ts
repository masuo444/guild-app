import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { Resend } from 'resend'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ADMIN_EMAILS } from '@/lib/access'
import { translateJaToEn } from '@/lib/translate'

let vapidInitialized = false
function initVapid() {
  if (!vapidInitialized && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails('mailto:keisukendo414@gmail.com', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY)
    vapidInitialized = true
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function buildEmailHtml(body: string, lang: 'ja' | 'en'): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://guild-app.fomusglobal.com'
  const bodyHtml = escapeHtml(body).replace(/\n/g, '<br/>')
  const cta = lang === 'en' ? 'Open FOMUS GUILD' : 'FOMUS GUILD を開く'
  const footer = lang === 'en'
    ? 'You are receiving this because you are a FOMUS GUILD member.'
    : 'このメールは FOMUS GUILD 会員の方にお送りしています。'
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color:#222;">
      <div style="font-size:13px; letter-spacing:2px; color:#999; margin-bottom:16px;">FOMUS GUILD</div>
      <div style="font-size:15px; line-height:1.9;">${bodyHtml}</div>
      <div style="margin:28px 0;">
        <a href="${appUrl}/app" style="display:inline-block; background:#1c1917; color:#fff; text-decoration:none; padding:12px 24px; border-radius:9999px; font-size:14px;">${cta}</a>
      </div>
      <hr style="border:none; border-top:1px solid #eee; margin:20px 0;" />
      <p style="color:#999; font-size:12px;">${footer}</p>
    </div>`
}

export async function POST(request: NextRequest) {
  initVapid()

  // 管理者認証
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin' || ADMIN_EMAILS.includes(user.email as typeof ADMIN_EMAILS[number])
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { subject, body: message, sendPush = true, test = false } = body as {
    subject?: string; body?: string; sendPush?: boolean; test?: boolean
  }
  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'subject and body are required' }, { status: 400 })
  }

  // JA→EN 翻訳（英語ユーザー用）
  let subjectEn = subject, messageEn = message
  try {
    subjectEn = await translateJaToEn(subject)
    messageEn = await translateJaToEn(message)
  } catch (e) {
    console.error('Newsletter translation error:', e)
    // 翻訳失敗時は日本語のまま送る（送信自体は継続）
  }

  const service = createServiceClient()

  // 言語マップ（profiles）
  const { data: profiles } = await service.from('profiles').select('id, language')
  const langMap: Record<string, 'ja' | 'en'> = {}
  for (const p of profiles ?? []) langMap[p.id] = (p.language === 'en' ? 'en' : 'ja')

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
  if (resend) {
    const results = await Promise.allSettled(targets.filter(u => u.email).map(async (u) => {
      const lang = langMap[u.id] || 'ja'
      const subj = lang === 'en' ? subjectEn : subject
      const html = buildEmailHtml(lang === 'en' ? messageEn : message, lang)
      const { error } = await resend.emails.send({ from: fromEmail, to: u.email!, subject: `[FOMUS GUILD] ${subj}`, html })
      if (error) throw error
    }))
    emailSent = results.filter(r => r.status === 'fulfilled').length
    emailFailed = results.length - emailSent
  }

  // プッシュ（購読者のみ・言語別）
  let pushSent = 0, pushFailed = 0
  if (sendPush) {
    let subsQuery = service.from('push_subscriptions').select('id, endpoint, p256dh, auth, user_id')
    if (test) subsQuery = subsQuery.eq('user_id', user.id)
    const { data: subs } = await subsQuery
    if (subs && subs.length) {
      const results = await Promise.allSettled(subs.map(async (sub) => {
        const lang = langMap[sub.user_id] || 'ja'
        const payload = JSON.stringify({
          title: lang === 'en' ? subjectEn : subject,
          body: lang === 'en' ? 'Tap to read this week\'s newsletter.' : '今週のメルマガが届きました。タップして読む。',
          url: '/app',
        })
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)
        } catch (err) {
          const code = (err as { statusCode?: number }).statusCode
          if (code === 410 || code === 404) await service.from('push_subscriptions').delete().eq('id', sub.id)
          throw err
        }
      }))
      pushSent = results.filter(r => r.status === 'fulfilled').length
      pushFailed = results.length - pushSent
    }
  }

  return NextResponse.json({ success: true, test, emailSent, emailFailed, pushSent, pushFailed, subjectEn })
}
