'use client'

// Google Maps JS API を直接使う地図とマーカー。
// 以前は @vis.gl/react-google-maps を使っていたが、地図の初期化が遅いときに
// マーカーの付け外し（marker.map = ...）が Maps 内部で getRootNode 例外を投げ、
// React のエラー境界をすり抜けてマップページごと落ちていた（2026-09）。
// ここでは地図が idle になってからマーカーを載せ、付け外しはすべて例外を握りつぶす。

import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

let loadPromise: Promise<void> | null = null

// Maps JS API をページに1回だけ読み込む。言語は最初の読み込み時のものに固定される
// （GuildMap の言語切替はページごとリロードしている）
function loadGoogleMaps(apiKey: string, language: string): Promise<void> {
  if (window.google?.maps?.importLibrary) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = new Promise<void>((resolve, reject) => {
    const callbackName = '__guildGoogleMapsReady'
    ;(window as unknown as Record<string, unknown>)[callbackName] = () => resolve()
    const script = document.createElement('script')
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      `&language=${encodeURIComponent(language)}&loading=async&callback=${callbackName}`
    script.async = true
    script.onerror = () => {
      loadPromise = null
      script.remove()
      reject(new Error('Google Maps JS API の読み込みに失敗しました'))
    }
    document.head.appendChild(script)
  })
  return loadPromise
}

// 描画を終えた地図だけを渡す。null の間はマーカーを載せない
const MapContext = createContext<google.maps.Map | null>(null)

interface GoogleMapViewProps {
  apiKey: string
  language: string
  mapId?: string
  // center / zoom / options は最初の値だけ使う（後から変わっても地図は作り直さない）
  center: google.maps.LatLngLiteral
  zoom: number
  options?: google.maps.MapOptions
  className?: string
  style?: CSSProperties
  onReady?: (map: google.maps.Map) => void
  onClick?: (position: google.maps.LatLngLiteral) => void
  onError?: () => void
  children?: ReactNode
}

export function GoogleMapView({
  apiKey,
  language,
  mapId,
  center,
  zoom,
  options,
  className,
  style,
  onReady,
  onClick,
  onError,
  children,
}: GoogleMapViewProps) {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const [readyMap, setReadyMap] = useState<google.maps.Map | null>(null)
  const initialRef = useRef({ center, zoom, mapId, options })
  const callbacksRef = useRef({ onReady, onClick, onError })

  useEffect(() => {
    callbacksRef.current = { onReady, onClick, onError }
  })

  useEffect(() => {
    let cancelled = false
    let map: google.maps.Map | null = null
    const listeners: google.maps.MapsEventListener[] = []

    loadGoogleMaps(apiKey, language)
      .then(() => google.maps.importLibrary('maps') as Promise<google.maps.MapsLibrary>)
      .then(({ Map }) => {
        if (cancelled || !mapDivRef.current) return
        const init = initialRef.current
        map = new Map(mapDivRef.current, {
          center: init.center,
          zoom: init.zoom,
          mapId: init.mapId,
          ...init.options,
        })
        const createdMap = map
        listeners.push(
          google.maps.event.addListenerOnce(createdMap, 'idle', () => {
            if (cancelled) return
            setReadyMap(createdMap)
            callbacksRef.current.onReady?.(createdMap)
          }),
          createdMap.addListener('click', (event: google.maps.MapMouseEvent) => {
            const latLng = event.latLng
            if (latLng) callbacksRef.current.onClick?.({ lat: latLng.lat(), lng: latLng.lng() })
          }),
        )
      })
      .catch(() => {
        if (!cancelled) callbacksRef.current.onError?.()
      })

    return () => {
      cancelled = true
      listeners.forEach((listener) => listener.remove())
      if (map) google.maps.event.clearInstanceListeners(map)
    }
  }, [apiKey, language])

  return (
    <div className={className} style={style}>
      {/* 地図の中身は Maps が管理するので、React の子要素とは別の div に描かせる */}
      <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />
      <MapContext.Provider value={readyMap}>{readyMap && children}</MapContext.Provider>
    </div>
  )
}

interface HtmlMarkerProps {
  position: google.maps.LatLngLiteral
  title?: string
  onClick?: () => void
  // 省略すると Google 標準のピンになる
  children?: ReactNode
}

// 地図上のマーカー。children を渡すとその React 要素がマーカーの見た目になる
export function HtmlMarker({ position, title, onClick, children }: HtmlMarkerProps) {
  const map = useContext(MapContext)
  const [content] = useState(() => document.createElement('div'))
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)
  const latestRef = useRef({ position, title, onClick })
  const hasContent = children !== undefined && children !== null && children !== false

  useEffect(() => {
    latestRef.current = { position, title, onClick }
  })

  useEffect(() => {
    if (!map) return

    let cancelled = false
    let marker: google.maps.marker.AdvancedMarkerElement | null = null
    let clickListener: google.maps.MapsEventListener | null = null

    ;(google.maps.importLibrary('marker') as Promise<google.maps.MarkerLibrary>)
      .then(({ AdvancedMarkerElement }) => {
        if (cancelled) return
        const latest = latestRef.current
        try {
          marker = new AdvancedMarkerElement({
            position: latest.position,
            title: latest.title,
            content: hasContent ? content : undefined,
          })
          marker.map = map
        } catch {
          // 地図が壊れた状態でもページは落とさない（このマーカーだけ出ない）
          marker = null
          return
        }
        if (hasContent) content.style.cursor = latest.onClick ? 'pointer' : ''
        clickListener = marker.addListener('click', () => latestRef.current.onClick?.())
        markerRef.current = marker
      })
      .catch(() => {})

    return () => {
      cancelled = true
      clickListener?.remove()
      if (marker) {
        try {
          marker.map = null
        } catch {
          // 外すときも同様に握りつぶす
        }
      }
      markerRef.current = null
    }
  }, [map, content, hasContent])

  // 位置・タイトルの変更に追従する（マーカーは作り直さない）
  const { lat, lng } = position
  useEffect(() => {
    const marker = markerRef.current
    if (!marker) return
    try {
      marker.position = { lat, lng }
      marker.title = title ?? ''
    } catch {
      // 同上
    }
  }, [lat, lng, title])

  return hasContent ? createPortal(children, content) : null
}
