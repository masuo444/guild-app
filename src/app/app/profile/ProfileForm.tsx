'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'

interface ProfileFormProps {
  profile: Profile
  email: string
}

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    display_name: profile.display_name || '',
    home_country: profile.home_country || '',
    home_city: profile.home_city || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const supabase = createClient()

    // Geocoding で座標を取得（Google Maps API）
    let lat = profile.lat
    let lng = profile.lng

    if (formData.home_city && formData.home_country) {
      try {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          `${formData.home_city}, ${formData.home_country}`
        )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`

        const response = await fetch(geocodeUrl)
        const data = await response.json()

        if (data.results && data.results[0]) {
          lat = data.results[0].geometry.location.lat
          lng = data.results[0].geometry.location.lng
        }
      } catch (error) {
        console.error('Geocoding error:', error)
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: formData.display_name,
        home_country: formData.home_country,
        home_city: formData.home_city,
        lat,
        lng,
      })
      .eq('id', profile.id)

    if (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully' })
      router.refresh()
    }

    setSaving(false)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="space-y-6">
      {/* プロフィール編集 */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-zinc-900">Personal Information</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              value={email}
              disabled
              className="bg-zinc-50"
            />

            <Input
              label="Display Name"
              value={formData.display_name}
              onChange={(e) =>
                setFormData({ ...formData, display_name: e.target.value })
              }
              placeholder="Your name"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Country"
                value={formData.home_country}
                onChange={(e) =>
                  setFormData({ ...formData, home_country: e.target.value })
                }
                placeholder="e.g., Japan"
              />
              <Input
                label="City"
                value={formData.home_city}
                onChange={(e) =>
                  setFormData({ ...formData, home_city: e.target.value })
                }
                placeholder="e.g., Tokyo"
              />
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {message.text}
              </div>
            )}

            <Button type="submit" loading={saving}>
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* メンバーシップ情報 */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-zinc-900">Membership</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-600">Membership ID</span>
              <span className="font-mono text-zinc-900">{profile.membership_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Status</span>
              <span className={`font-medium ${
                profile.subscription_status === 'active' ? 'text-green-600' : 'text-red-600'
              }`}>
                {profile.subscription_status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Member Since</span>
              <span className="text-zinc-900">
                {new Date(profile.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ログアウト */}
      <Card>
        <CardContent className="py-4">
          <Button variant="outline" onClick={handleSignOut} className="w-full">
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
