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
    instagram_id: profile.instagram_id || '',
    avatar_url: profile.avatar_url || '',
    home_country: profile.home_country || '',
    home_city: profile.home_city || '',
    show_location_on_map: profile.show_location_on_map ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const supabase = createClient()

    // 都市・国が設定されている場合は Geocoding で座標を取得
    let lat = profile.lat || 0
    let lng = profile.lng || 0

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
      } catch {
        // Geocoding failed - continue with default coordinates
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: formData.display_name,
        instagram_id: formData.instagram_id || null,
        avatar_url: formData.avatar_url || null,
        home_country: formData.home_country,
        home_city: formData.home_city,
        lat,
        lng,
        show_location_on_map: formData.show_location_on_map,
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
          <h2 className="font-semibold text-white">Personal Information</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              value={email}
              disabled
              className="bg-white/5"
            />

            <Input
              label="Display Name"
              value={formData.display_name}
              onChange={(e) =>
                setFormData({ ...formData, display_name: e.target.value })
              }
              placeholder="Your name"
            />

            <div>
              <label className="block text-sm text-zinc-300 mb-1">Instagram</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 bg-zinc-700 border border-r-0 border-zinc-500/30 rounded-l-lg text-zinc-400 text-sm">
                  @
                </span>
                <input
                  type="text"
                  value={formData.instagram_id}
                  onChange={(e) =>
                    setFormData({ ...formData, instagram_id: e.target.value.replace(/^@/, '') })
                  }
                  placeholder="username"
                  className="flex-1 px-4 py-2 bg-white/10 backdrop-blur border border-zinc-500/30 rounded-r-lg text-white placeholder-zinc-300/50 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0] focus:border-transparent"
                />
              </div>
              {formData.instagram_id && (
                <a
                  href={`https://instagram.com/${formData.instagram_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#c0c0c0] hover:text-white mt-1 inline-block"
                >
                  View profile →
                </a>
              )}
            </div>

            {/* Avatar URL */}
            <div>
              <label className="block text-sm text-zinc-300 mb-1">Profile Image URL</label>
              <p className="text-xs text-zinc-400 mb-2">This image will be shown as your marker on the Guild Map</p>
              <input
                type="url"
                value={formData.avatar_url}
                onChange={(e) =>
                  setFormData({ ...formData, avatar_url: e.target.value })
                }
                placeholder="https://example.com/your-photo.jpg"
                className="w-full px-4 py-2 bg-white/10 backdrop-blur border border-zinc-500/30 rounded-lg text-white placeholder-zinc-300/50 focus:outline-none focus:ring-2 focus:ring-[#c0c0c0] focus:border-transparent"
              />
              {formData.avatar_url && (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={formData.avatar_url}
                    alt="Preview"
                    className="w-12 h-12 rounded-full object-cover border-2 border-green-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  <span className="text-xs text-zinc-400">Preview</span>
                </div>
              )}
            </div>

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

            {/* 位置公開設定 */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-zinc-500/30">
              <div>
                <p className="text-sm font-medium text-white">Show location on map</p>
                <p className="text-xs text-zinc-400">Allow other members to see your location on the Guild Map</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, show_location_on_map: !formData.show_location_on_map })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  formData.show_location_on_map ? 'bg-green-500' : 'bg-zinc-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    formData.show_location_on_map ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.type === 'success'
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
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
          <h2 className="font-semibold text-white">Membership</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-300">Membership ID</span>
              <span className="font-mono text-white">{profile.membership_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-300">Status</span>
              <span className={`font-medium ${
                profile.subscription_status === 'active' ? 'text-green-400' : 'text-red-400'
              }`}>
                {profile.subscription_status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-300">Member Since</span>
              <span className="text-white">
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
