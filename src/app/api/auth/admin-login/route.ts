import { NextResponse } from 'next/server'

/**
 * DISABLED FOR SECURITY.
 *
 * This endpoint previously returned a working Supabase magic link
 * (action_link) for any supplied email, which allowed anyone who knew an
 * email address to log in as that user — including the admin account.
 *
 * Login now goes exclusively through the OTP flow (/api/auth/send-otp +
 * /api/auth/verify-otp), where the one-time code is delivered by email and
 * verified server-side. Never return an auth token/link to the browser for a
 * caller-supplied email.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint has been disabled. Please sign in with the code sent to your email.' },
    { status: 410 }
  )
}
