'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { compressAndCropImage, formatFileSize } from '@/lib/imageUtils'
import { APIProvider, Map as GoogleMap, AdvancedMarker } from '@vis.gl/react-google-maps'
import { useLanguage } from '@/lib/i18n'

interface OnboardingFormProps {
  profile: Profile
}

export function OnboardingForm({ profile }: OnboardingFormProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    display_name: profile.display_name || '',
    avatar_url: profile.avatar_url || '',
    home_country: profile.home_country || '',
    home_state: profile.home_state || '',
    home_city: profile.home_city || '',
    lat: profile.lat || 0,
    lng: profile.lng || 0,
    show_location_on_map: profile.show_location_on_map ?? true,
  })
  const [geocoding, setGeocoding] = useState(false)

  // 住所からジオコーディング
  const geocodeLocation = useCallback(async (): Promise<{ lat: number; lng: number } | null> => {
    if (!formData.home_city && !formData.home_state && !formData.home_country) return null
    setGeocoding(true)
    try {
      const query = [formData.home_city, formData.home_state, formData.home_country].filter(Boolean).join(', ')
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      const response = await fetch(geocodeUrl)
      const data = await response.json()
      if (data.results && data.results[0]) {
        const { lat, lng } = data.results[0].geometry.location
        setFormData(prev => ({ ...prev, lat, lng }))
        return { lat, lng }
      }
      return null
    } catch {
      return null
    } finally {
      setGeocoding(false)
    }
  }, [formData.home_city, formData.home_state, formData.home_country])

  // 住所変更時の自動ジオコーディング（デバウンス付き）
  useEffect(() => {
    if (!formData.home_city && !formData.home_state && !formData.home_country) return
    if (formData.lat !== 0 || formData.lng !== 0) return

    const timer = setTimeout(() => {
      geocodeLocation()
    }, 800)

    return () => clearTimeout(timer)
  }, [formData.home_city, formData.home_state, formData.home_country, formData.lat, formData.lng, geocodeLocation])

  // 画像アップロード
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: t.selectImageFile })
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      const compressedBlob = await compressAndCropImage(file, {
        maxSize: 800,
        quality: 0.85,
        maxFileSize: 500 * 1024,
      })

      const supabase = createClient()
      const fileExt = 'jpg'
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      if (formData.avatar_url && formData.avatar_url.includes('supabase')) {
        const oldPath = formData.avatar_url.split('/').pop()
        if (oldPath) {
          await supabase.storage.from('avatars').remove([`avatars/${oldPath}`])
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }))
      setMessage({ type: 'success', text: `${t.imageUploaded} (${formatFileSize(compressedBlob.size)})` })
    } catch (error) {
      console.error('Upload error:', error)
      setMessage({ type: 'error', text: t.imageUploadFailed })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    let lat = formData.lat
    let lng = formData.lng

    if (lat === 0 && lng === 0 && (formData.home_city || formData.home_state || formData.home_country)) {
      const result = await geocodeLocation()
      if (result) {
        lat = result.lat
        lng = result.lng
      }
    }

    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          display_name: formData.display_name,
          avatar_url: formData.avatar_url || null,
          home_country: formData.home_country,
          home_state: formData.home_state,
          home_city: formData.home_city,
          lat,
          lng,
          show_location_on_map: formData.show_location_on_map,
        }),
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        setSaving(false)
        setMessage({ type: 'error', text: result.error || 'Update failed' })
        return
      }

      // 完了 → ダッシュボードへ
      router.push('/app')
      router.refresh()
    } catch {
      setSaving(false)
      setMessage({ type: 'error', text: 'Network error' })
    }
  }

  const isValid = formData.display_name.trim() && (formData.home_country.trim() || formData.home_city.trim())

  return (
    <Card>
      <CardContent className="py-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">{t.onboardingTitle}</h1>
          <p className="text-zinc-400">{t.onboardingSubtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 表示名（必須） */}
          <Input
            label={`${t.displayName} *`}
            value={formData.display_name}
            onChange={(e) =>
              setFormData({ ...formData, display_name: e.target.value })
            }
            placeholder="Your name"
          />

          {/* プロフィール画像（任意） */}
          <div>
            <label className="block text-sm text-zinc-300 mb-1">{t.profileImage}</label>
            <p className="text-xs text-zinc-400 mb-2">{t.profileImageDesc}</p>
            <p className="text-xs text-amber-400 mb-3">{t.masuPhotoRecommend}</p>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {formData.avatar_url ? (
                  <img
                    src={formData.avatar_url}
                    alt="Preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-green-500"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-zinc-700 flex items-center justify-center">
                    <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="onboarding-avatar-upload"
                />
                <label
                  htmlFor="onboarding-avatar-upload"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                    uploading
                      ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                      : 'bg-[#c0c0c0] text-zinc-900 hover:bg-white'
                  }`}
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t.compressing}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {t.selectImage}
                    </>
                  )}
                </label>
                {formData.avatar_url && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, avatar_url: '' })}
                    className="ml-2 text-xs text-zinc-400 hover:text-red-400 transition-colors"
                  >
                    {t.removeImage}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 国・県・市入力 */}
          <div className="space-y-3">
            <p className="text-xs text-zinc-400">{t.locationInputNote}</p>
            <div className="grid grid-cols-3 gap-3">
              <Input
                label={`${t.countryLabel} *`}
                value={formData.home_country}
                onChange={(e) =>
                  setFormData({ ...formData, home_country: e.target.value, lat: 0, lng: 0 })
                }
                placeholder="Japan"
              />
              <Input
                label={t.stateLabel}
                value={formData.home_state}
                onChange={(e) =>
                  setFormData({ ...formData, home_state: e.target.value, lat: 0, lng: 0 })
                }
                placeholder="Tokyo"
              />
              <Input
                label={t.cityLabel}
                value={formData.home_city}
                onChange={(e) =>
                  setFormData({ ...formData, home_city: e.target.value, lat: 0, lng: 0 })
                }
                placeholder="Shibuya"
              />
            </div>
          </div>

          {/* ミニマップ */}
          {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm text-zinc-300">{t.pinLocation}</label>
                <button
                  type="button"
                  onClick={() => geocodeLocation()}
                  disabled={geocoding}
                  className="text-xs text-[#c0c0c0] hover:text-white transition-colors disabled:opacity-50"
                >
                  {geocoding ? t.geocodingLabel : t.reGeocode}
                </button>
              </div>
              <p className="text-xs text-zinc-400 mb-2">
                {formData.lat !== 0 || formData.lng !== 0
                  ? t.adjustPinDesc
                  : t.setPinDesc}
              </p>
              <div className="w-full h-[300px] rounded-lg overflow-hidden border border-zinc-500/30">
                <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
                  <GoogleMap
                    defaultCenter={formData.lat !== 0 || formData.lng !== 0 ? { lat: formData.lat, lng: formData.lng } : { lat: 35.6762, lng: 139.6503 }}
                    defaultZoom={formData.lat !== 0 || formData.lng !== 0 ? 12 : 3}
                    mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'}
                    style={{ width: '100%', height: '100%' }}
                    gestureHandling="greedy"
                    disableDefaultUI={false}
                    zoomControl={true}
                    fullscreenControl={false}
                    streetViewControl={false}
                    mapTypeControl={false}
                    clickableIcons={false}
                    onClick={(e) => {
                      const latLng = e.detail?.latLng
                      if (latLng) {
                        const lat = typeof latLng.lat === 'function' ? (latLng.lat as () => number)() : latLng.lat
                        const lng = typeof latLng.lng === 'function' ? (latLng.lng as () => number)() : latLng.lng
                        if (typeof lat === 'number' && typeof lng === 'number') {
                          setFormData(prev => ({ ...prev, lat, lng }))
                        }
                      }
                    }}
                  >
                    {(formData.lat !== 0 || formData.lng !== 0) && (
                      <AdvancedMarker
                        position={{ lat: formData.lat, lng: formData.lng }}
                      />
                    )}
                  </GoogleMap>
                </APIProvider>
              </div>
            </div>
          )}

          {/* マップに位置を表示トグル */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-zinc-500/30">
            <div>
              <p className="text-sm font-medium text-white">{t.showLocationOnMap}</p>
              <p className="text-xs text-zinc-400">{t.showLocationDesc}</p>
              <p className="text-xs text-zinc-500 mt-1">{t.showLocationApproxNote}</p>
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

          {/* メッセージ */}
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

          {/* 保存ボタン */}
          <Button type="submit" loading={saving} disabled={!isValid} className="w-full">
            {t.onboardingComplete}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
