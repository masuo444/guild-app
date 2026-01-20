'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MembershipType, isFreeMembershipType, MEMBERSHIP_TYPE_LABELS } from '@/types/database'

type InviteStatus = 'loading' | 'valid' | 'invalid' | 'used' | 'submitting' | 'sent'

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  const [status, setStatus] = useState<InviteStatus>('loading')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [membershipType, setMembershipType] = useState<MembershipType>('standard')
  const [isFree, setIsFree] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    async function checkInvite() {
      const { data, error } = await supabase
        .from('invites')
        .select('used, membership_type')
        .eq('code', code)
        .single()

      if (error || !data) {
        setStatus('invalid')
        return
      }

      if (data.used) {
        setStatus('used')
        return
      }

      const type = (data.membership_type || 'standard') as MembershipType
      setMembershipType(type)
      setIsFree(isFreeMembershipType(type))
      setStatus('valid')
    }

    checkInvite()
  }, [code])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setStatus('submitting')

    const supabase = createClient()

    // Magic Link を送信
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?invite_code=${code}`,
        data: {
          invite_code: code,
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setStatus('valid')
      return
    }

    setStatus('sent')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-spin w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-zinc-900 mb-4">Invalid Invitation</h1>
          <p className="text-zinc-600 mb-6">
            This invitation code is not valid. Please contact the person who invited you.
          </p>
          <Button variant="secondary" onClick={() => router.push('/')}>
            Return Home
          </Button>
        </div>
      </div>
    )
  }

  if (status === 'used') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-zinc-900 mb-4">Invitation Used</h1>
          <p className="text-zinc-600 mb-6">
            This invitation has already been used. If you&apos;ve already registered, please log in.
          </p>
          <Button onClick={() => router.push('/auth/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  if (status === 'sent') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-4">Check Your Email</h1>
          <p className="text-zinc-600 mb-2">
            We&apos;ve sent a magic link to <strong>{email}</strong>
          </p>
          <p className="text-zinc-500 text-sm">
            Click the link in the email to continue your registration.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">
              Welcome to FOMUS GUILD
            </h1>
            <p className="text-zinc-600">
              You&apos;ve been invited to join an exclusive community.
            </p>
            {isFree && (
              <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-medium">
                {MEMBERSHIP_TYPE_LABELS[membershipType]} Invitation
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Email Address"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              required
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={status === 'submitting'}
            >
              Continue with Email
            </Button>
          </form>

          <p className="text-xs text-zinc-500 text-center mt-6">
            {isFree ? (
              <>
                As a {MEMBERSHIP_TYPE_LABELS[membershipType]}, you&apos;ll get free access
                to FOMUS GUILD. No payment required.
              </>
            ) : (
              <>
                After verification, you&apos;ll be asked to complete a $10/month subscription
                to activate your membership.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
