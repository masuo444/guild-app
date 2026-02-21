import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { Resend } from 'resend'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ADMIN_EMAILS } from '@/lib/access'

let vapidInitialized = false
function initVapid() {
  if (!vapidInitialized && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      'mailto:keisukendo414@gmail.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    )
    vapidInitialized = true
  }
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export async function POST(request: NextRequest) {
  initVapid()

  try {
    // 認証チェック
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 管理者チェック
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin' || ADMIN_EMAILS.includes(user.email as typeof ADMIN_EMAILS[number])

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { title, body: notificationBody, url, sendEmail } = body as {
      title?: string
      body?: string
      url?: string
      sendEmail?: boolean
    }

    if (!title || !notificationBody) {
      return NextResponse.json({ error: 'title and body are required' }, { status: 400 })
    }

    // 全subscriptionを取得
    const serviceClient = createServiceClient()
    const { data: subscriptions, error: fetchError } = await serviceClient
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')

    if (fetchError) {
      console.error('Failed to fetch subscriptions:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
    }

    // Web Push 送信
    let sent = 0
    let failed = 0

    if (subscriptions && subscriptions.length > 0) {
      const payload = JSON.stringify({
        title,
        body: notificationBody,
        url: url || '/app',
      })

      const results = await Promise.allSettled(
        subscriptions.map(async (sub) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth,
                },
              },
              payload
            )
            return { id: sub.id, success: true }
          } catch (err) {
            const statusCode = (err as { statusCode?: number }).statusCode
            // 410 Gone or 404 Not Found → stale subscription
            if (statusCode === 410 || statusCode === 404) {
              await serviceClient
                .from('push_subscriptions')
                .delete()
                .eq('id', sub.id)
            }
            return { id: sub.id, success: false, statusCode }
          }
        })
      )

      sent = results.filter(
        (r) => r.status === 'fulfilled' && r.value.success
      ).length
      failed = results.length - sent
    }

    // メール送信
    let emailSent = 0
    let emailFailed = 0

    if (sendEmail) {
      const { data: { users: allUsers }, error: listError } = await serviceClient.auth.admin.listUsers({ perPage: 1000 })

      if (listError) {
        console.error('Failed to list users:', listError)
      } else {
        const emails = allUsers
          .map((u) => u.email)
          .filter((e): e is string => !!e)

        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://guild-app.fomusglobal.com'
        const linkHtml = url
          ? `<p><a href="${appUrl}${url}" style="color: #c0c0c0;">詳細を見る</a></p>`
          : ''

        const emailResults = await Promise.allSettled(
          emails.map(async (email) => {
            const { error: sendError } = await getResend().emails.send({
              from: fromEmail,
              to: email,
              subject: `[FOMUS GUILD] ${title}`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #333;">${title}</h2>
                  <p style="color: #555; white-space: pre-wrap;">${notificationBody}</p>
                  ${linkHtml}
                  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                  <p style="color: #999; font-size: 12px;">FOMUS GUILD からのお知らせです</p>
                </div>
              `,
            })
            if (sendError) {
              throw sendError
            }
          })
        )

        emailSent = emailResults.filter((r) => r.status === 'fulfilled').length
        emailFailed = emailResults.filter((r) => r.status === 'rejected').length

        if (emailFailed > 0) {
          const failures = emailResults
            .filter((r) => r.status === 'rejected')
            .map((r) => (r as PromiseRejectedResult).reason)
          console.error('Email send failures:', failures)
        }
      }
    }

    return NextResponse.json({ sent, failed, emailSent, emailFailed })
  } catch (error) {
    console.error('Send notification error:', error)
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500 }
    )
  }
}
