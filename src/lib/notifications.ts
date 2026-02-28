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
