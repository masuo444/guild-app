/**
 * 画像を正方形にクロップして圧縮するユーティリティ
 */

interface CompressOptions {
  maxSize?: number // 最大サイズ（ピクセル）
  quality?: number // 圧縮品質 (0-1)
  maxFileSize?: number // 最大ファイルサイズ（バイト）
}

/**
 * 画像ファイルを読み込んでImageオブジェクトを返す
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 画像を正方形にクロップして圧縮する
 */
export async function compressAndCropImage(
  file: File,
  options: CompressOptions = {}
): Promise<Blob> {
  const {
    maxSize = 800, // デフォルト 800x800
    quality = 0.8, // デフォルト品質 80%
    maxFileSize = 500 * 1024, // デフォルト 500KB
  } = options

  const img = await loadImage(file)

  // 正方形にクロップするためのサイズ計算
  const minDimension = Math.min(img.width, img.height)
  const cropX = (img.width - minDimension) / 2
  const cropY = (img.height - minDimension) / 2

  // 出力サイズを決定
  const outputSize = Math.min(minDimension, maxSize)

  // Canvas を使用して画像を処理
  const canvas = document.createElement('canvas')
  canvas.width = outputSize
  canvas.height = outputSize
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  // 正方形にクロップして描画
  ctx.drawImage(
    img,
    cropX, cropY, minDimension, minDimension, // ソース（クロップ領域）
    0, 0, outputSize, outputSize // 出力
  )

  // 画像URLを解放
  URL.revokeObjectURL(img.src)

  // 品質を調整しながら圧縮
  let currentQuality = quality
  let blob: Blob | null = null

  while (currentQuality > 0.1) {
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', currentQuality)
    })

    if (blob && blob.size <= maxFileSize) {
      break
    }

    // ファイルサイズが大きすぎる場合は品質を下げる
    currentQuality -= 0.1
  }

  if (!blob) {
    throw new Error('Failed to compress image')
  }

  return blob
}

/**
 * ファイルサイズを人間が読める形式に変換
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
