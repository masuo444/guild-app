import { NextResponse } from 'next/server'

/**
 * DISABLED FOR SECURITY.
 *
 * This endpoint previously registered a caller-supplied email WITHOUT any
 * email-ownership check and returned a working login callback URL
 * (token_hash), so anyone with a valid invite code could log in as any email
 * — including the admin. Free-invite registration now goes through the OTP
 * flow (signInWithOtp + verifyOtp) so the email is proven before a session is
 * issued; see src/app/invite/[code]/page.tsx and /api/auth/quick-register.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint has been disabled. Please complete registration with the code sent to your email.' },
    { status: 410 }
  )
}
