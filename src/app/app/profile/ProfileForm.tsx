'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { compressAndCropImage, formatFileSize } from '@/lib/imageUtils'
import { generateInviteCode } from '@/lib/utils'
import { APIProvider, Map as GoogleMap, Marker } from '@vis.gl/react-google-maps'
import { useLanguage } from '@/lib/i18n'

interface ProfileFormProps {
  profile: Profile
  email: string
}

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const router = useRouter()
  const { language, setLanguage, t } = useLanguage()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 招待コード関連
  const [creatingInvite, setCreatingInvite] = useState(false)
  const [myInvites, setMyInvites] = useState<Array<{ code: string; used: boolean; created_at: string }>>([])
  const [invitesLoaded, setInvitesLoaded] = useState(false)
  const [copiedInviteCode, setCopiedInviteCode] = useState<string | null>(null)
  const [lastCreatedInvite, setLastCreatedInvite] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    display_name: profile.display_name || '',
    instagram_id: profile.instagram_id || '',
    avatar_url: profile.avatar_url || '',
    home_country: profile.home_country || '',
    home_state: profile.home_state || '',
    home_city: profile.home_city || '',
    lat: profile.lat || 0,
    lng: profile.lng || 0,
    show_location_on_map: profile.show_location_on_map ?? true,
  })
  const [geocoding, setGeocoding] = useState(false)

  // 住所からジオコーディングしてマップを更新（日本語/英語対応）
  const geocodeLocation = useCallback(async (): Promise<{ lat: number; lng: number } | null> => {
    if (!formData.home_city && !formData.home_state && !formData.home_country) return null
    setGeocoding(true)
    try {
      // 市, 県, 国の順で結合（Google Geocoding APIは日本語/英語どちらも対応）
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

  // 住所が変更されたら自動でジオコーディング（デバウンス付き）
  useEffect(() => {
    if (!formData.home_city && !formData.home_state && !formData.home_country) return
    // 既にピンが設定されている場合はスキップ
    if (formData.lat !== 0 || formData.lng !== 0) return

    const timer = setTimeout(() => {
      geocodeLocation()
    }, 800) // 800ms待ってから実行

    return () => clearTimeout(timer)
  }, [formData.home_city, formData.home_state, formData.home_country, formData.lat, formData.lng, geocodeLocation])

  // 画像アップロード処理
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 500MB制限チェック
    const maxSize = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSize) {
      setMessage({ type: 'error', text: `${t.fileTooLarge} (max 500MB). ${formatFileSize(file.size)}` })
      return
    }

    // 画像ファイルかチェック
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: t.selectImageFile })
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      // 画像を圧縮・正方形にクロップ（最大800px、500KB以下に圧縮）
      const compressedBlob = await compressAndCropImage(file, {
        maxSize: 800,
        quality: 0.85,
        maxFileSize: 500 * 1024, // 500KB
      })

      const supabase = createClient()

      // ファイル名を生成
      const fileExt = 'jpg'
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // 古い画像を削除（もしあれば）
      if (formData.avatar_url && formData.avatar_url.includes('supabase')) {
        const oldPath = formData.avatar_url.split('/').pop()
        if (oldPath) {
          await supabase.storage.from('avatars').remove([`avatars/${oldPath}`])
        }
      }

      // Supabase Storageにアップロード
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        })

      if (uploadError) {
        throw uploadError
      }

      // 公開URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // フォームを更新
      setFormData({ ...formData, avatar_url: publicUrl })
      setMessage({ type: 'success', text: `${t.imageUploaded} (${formatFileSize(compressedBlob.size)})` })

    } catch (error) {
      console.error('Upload error:', error)
      setMessage({ type: 'error', text: t.imageUploadFailed })
    } finally {
      setUploading(false)
      // ファイル入力をリセット
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

    // lat/lngが未設定で住所がある場合のみジオコーディング
    if (lat === 0 && lng === 0 && (formData.home_city || formData.home_state || formData.home_country)) {
      const result = await geocodeLocation()
      if (result) {
        lat = result.lat
        lng = result.lng
      }
    }

    // 直接Supabaseで更新（シンプル）
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: formData.display_name,
        instagram_id: formData.instagram_id || null,
        avatar_url: formData.avatar_url || null,
        home_country: formData.home_country,
        home_state: formData.home_state,
        home_city: formData.home_city,
        lat,
        lng,
        show_location_on_map: formData.show_location_on_map,
      })
      .eq('id', profile.id)

    setSaving(false)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: t.profileUpdated })
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  // 自分の招待コードを取得
  const loadMyInvites = async () => {
    if (invitesLoaded) return
    const supabase = createClient()
    const { data } = await supabase
      .from('invites')
      .select('code, used, created_at')
      .eq('invited_by', profile.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      setMyInvites(data)
    }
    setInvitesLoaded(true)
  }

  // 招待コードを発行
  const handleCreateInvite = async () => {
    setCreatingInvite(true)
    const supabase = createClient()
    const code = generateInviteCode()

    const { data, error } = await supabase.from('invites').insert({
      code,
      invited_by: profile.id,
      used: false,
      membership_type: 'standard', // 一般ユーザーはスタンダードのみ
    }).select().single()

    setCreatingInvite(false)

    if (error) {
      console.error('招待コード作成エラー:', error)
      alert(`エラー: ${error.message}`)
    } else if (data) {
      setMyInvites(prev => [{ code: data.code, used: false, created_at: data.created_at }, ...prev])
      setLastCreatedInvite(code)
      // クリップボードにコピー
      const url = `${window.location.origin}/invite/${code}`
      navigator.clipboard.writeText(url)
    }
  }

  // 招待URLをコピー
  const copyInviteUrl = (code: string) => {
    const url = `${window.location.origin}/invite/${code}`
    navigator.clipboard.writeText(url)
    setCopiedInviteCode(code)
    setTimeout(() => setCopiedInviteCode(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* プロフィール編集 */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-white">{t.personalInfo}</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t.email}
              value={email}
              disabled
              className="bg-white/5"
            />

            <Input
              label={t.displayName}
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
                  {t.viewProfileLink}
                </a>
              )}
            </div>

            {/* Avatar Upload */}
            <div>
              <label className="block text-sm text-zinc-300 mb-1">{t.profileImage}</label>
              <p className="text-xs text-zinc-400 mb-3">{t.profileImageDesc}</p>

              <div className="flex items-start gap-4">
                {/* プレビュー */}
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

                {/* アップロードボタン */}
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
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

            <div className="space-y-3">
              <p className="text-xs text-zinc-400">{t.locationInputNote}</p>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label={t.countryLabel}
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

            {/* ミニマップ: ピン位置調整 */}
            {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (formData.home_city || formData.home_state || formData.home_country) && (
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
                <div className="w-full h-[400px] rounded-lg overflow-hidden border border-zinc-500/30">
                  <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
                    <GoogleMap
                      defaultCenter={formData.lat !== 0 || formData.lng !== 0 ? { lat: formData.lat, lng: formData.lng } : { lat: 35.6762, lng: 139.6503 }}
                      defaultZoom={formData.lat !== 0 || formData.lng !== 0 ? 12 : 3}
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
                        <Marker
                          position={{ lat: formData.lat, lng: formData.lng }}
                        />
                      )}
                    </GoogleMap>
                  </APIProvider>
                </div>
              </div>
            )}

            {/* 位置公開設定 */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-zinc-500/30">
              <div>
                <p className="text-sm font-medium text-white">{t.showLocationOnMap}</p>
                <p className="text-xs text-zinc-400">{t.showLocationDesc}</p>
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
              {t.saveChanges}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* メンバーシップ情報 */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-white">{t.membership}</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-300">{t.membershipIdLabel}</span>
              <span className="font-mono text-white">{profile.membership_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-300">{t.statusLabel}</span>
              <span className={`font-medium ${
                profile.subscription_status === 'active' ? 'text-green-400' : 'text-red-400'
              }`}>
                {profile.subscription_status === 'active' ? t.active : t.inactive}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-300">{t.memberSince}</span>
              <span className="text-white">
                {new Date(profile.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 招待コード発行 */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-white">{t.inviteFriends}</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-400 mb-4">{t.inviteFriendsDesc}</p>

          <Button onClick={handleCreateInvite} loading={creatingInvite} className="w-full mb-4">
            {t.generateInviteCode}
          </Button>

          {lastCreatedInvite && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-xl">
              <p className="text-green-300 text-sm font-medium">
                {t.inviteCodeCreated} <span className="font-mono">{lastCreatedInvite}</span>
              </p>
              <p className="text-green-400/70 text-xs mt-1">
                {t.inviteUrlCopied}
              </p>
            </div>
          )}

          {/* 発行済みコード一覧 */}
          <div className="border-t border-zinc-500/30 pt-4">
            <button
              onClick={loadMyInvites}
              className="text-sm text-[#c0c0c0] hover:text-white transition-colors"
            >
              {invitesLoaded ? t.generatedCodes : t.showGeneratedCodes}
            </button>

            {invitesLoaded && myInvites.length > 0 && (
              <div className="mt-3 space-y-2">
                {myInvites.map((invite) => (
                  <div
                    key={invite.code}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      invite.used ? 'bg-zinc-700/50' : 'bg-white/5'
                    }`}
                  >
                    <div>
                      <span className="font-mono text-sm text-white">{invite.code}</span>
                      <span className={`ml-2 text-xs ${invite.used ? 'text-zinc-500' : 'text-green-400'}`}>
                        {invite.used ? t.used : t.unused}
                      </span>
                    </div>
                    {!invite.used && (
                      <button
                        onClick={() => copyInviteUrl(invite.code)}
                        className="text-xs text-[#c0c0c0] hover:text-white transition-colors"
                      >
                        {copiedInviteCode === invite.code ? t.copied : t.copyUrl}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {invitesLoaded && myInvites.length === 0 && (
              <p className="text-zinc-500 text-sm mt-2">{t.noCodesYet}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 言語設定 */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-white">{t.languageSetting}</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-400 mb-3">{t.languageSettingDesc}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setLanguage('ja')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                language === 'ja'
                  ? 'bg-[#c0c0c0] text-zinc-900'
                  : 'bg-white/5 text-zinc-300 hover:bg-white/10 border border-zinc-500/30'
              }`}
            >
              {t.japanese}
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                language === 'en'
                  ? 'bg-[#c0c0c0] text-zinc-900'
                  : 'bg-white/5 text-zinc-300 hover:bg-white/10 border border-zinc-500/30'
              }`}
            >
              {t.english}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ログアウト */}
      <Card>
        <CardContent className="py-4">
          <Button variant="outline" onClick={handleSignOut} className="w-full">
            {t.signOut}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
