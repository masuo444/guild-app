import { Resend } from 'resend'
import { ADMIN_EMAILS } from '@/lib/access'

export async function notifyAdminNewMember(info: {
  email: string
  displayName: string | null
  membershipType: string
  subscriptionStatus: string
  invitedBy: string | null
  inviteCode: string | null
}) {
  if (!process.env.RESEND_API_KEY) return

  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })

  const inviteInfo = info.inviteCode
    ? `<tr><td style="padding:4px 8px;color:#999;">招待コード</td><td style="padding:4px 8px;">${info.inviteCode}</td></tr>`
    : ''
  const inviterInfo = info.invitedBy
    ? `<tr><td style="padding:4px 8px;color:#999;">招待者ID</td><td style="padding:4px 8px;">${info.invitedBy}</td></tr>`
    : ''

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">新メンバー入会通知</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <tr><td style="padding:4px 8px;color:#999;">メール</td><td style="padding:4px 8px;">${info.email}</td></tr>
        <tr><td style="padding:4px 8px;color:#999;">表示名</td><td style="padding:4px 8px;">${info.displayName || '(未設定)'}</td></tr>
        <tr><td style="padding:4px 8px;color:#999;">会員タイプ</td><td style="padding:4px 8px;">${info.membershipType}</td></tr>
        <tr><td style="padding:4px 8px;color:#999;">ステータス</td><td style="padding:4px 8px;">${info.subscriptionStatus}</td></tr>
        ${inviteInfo}
        ${inviterInfo}
        <tr><td style="padding:4px 8px;color:#999;">入会日時</td><td style="padding:4px 8px;">${now}</td></tr>
      </table>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #999; font-size: 12px;">FOMUS GUILD 管理者通知</p>
    </div>
  `

  for (const adminEmail of ADMIN_EMAILS) {
    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `[FOMUS GUILD] 新メンバー入会: ${info.displayName || info.email}`,
      html,
    })
  }
}

function escapeHtml(s: string | null | undefined): string {
  if (!s) return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * 枡セットプランの購入時、まっすー（管理者）に発送用の住所を通知する。
 * 住所は購入者がStripe Checkoutで入力した値なので、必ずエスケープして埋め込む。
 */
export async function notifyAdminMasuOrder(info: {
  email: string | null
  name: string | null
  phone: string | null
  address: {
    line1?: string | null
    line2?: string | null
    city?: string | null
    state?: string | null
    postal_code?: string | null
    country?: string | null
  } | null
}) {
  if (!process.env.RESEND_API_KEY) return

  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
  const a = info.address

  const addressHtml = a
    ? [
        `〒${escapeHtml(a.postal_code)}`,
        `${escapeHtml(a.state)}${escapeHtml(a.city)}`,
        escapeHtml(a.line1),
        escapeHtml(a.line2),
      ].filter(Boolean).join('<br/>')
    : '(住所が取得できませんでした。Stripeダッシュボードで確認してください)'

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #b45309;">🎁 枡セットの発送依頼</h2>
      <p style="color:#333;">枡セット付きプランが購入されました。以下の宛先に枡セットを発送してください。</p>
      <table style="border-collapse: collapse; width: 100%;">
        <tr><td style="padding:4px 8px;color:#999;">お名前</td><td style="padding:4px 8px;">${escapeHtml(info.name)}</td></tr>
        <tr><td style="padding:4px 8px;color:#999;">メール</td><td style="padding:4px 8px;">${escapeHtml(info.email)}</td></tr>
        <tr><td style="padding:4px 8px;color:#999;">電話</td><td style="padding:4px 8px;">${escapeHtml(info.phone)}</td></tr>
        <tr><td style="padding:4px 8px;color:#999;vertical-align:top;">発送先</td><td style="padding:4px 8px;">${addressHtml}</td></tr>
        <tr><td style="padding:4px 8px;color:#999;">購入日時</td><td style="padding:4px 8px;">${now}</td></tr>
      </table>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #999; font-size: 12px;">FOMUS GUILD 管理者通知</p>
    </div>
  `

  for (const adminEmail of ADMIN_EMAILS) {
    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `[FOMUS GUILD] 🎁 枡セット発送依頼: ${info.name || info.email || ''}`,
      html,
    })
  }
}
