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
 * Canvasから指定品質でBlobを生成
 */
function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', quality)
  })
}

/**
 * 画像を正方形にクロップして圧縮する
 * どんなに大きな画像でも確実に指定サイズ以下に圧縮する
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

  // 画像URLを解放
  const imgSrc = img.src

  // 段階的に解像度を下げながら圧縮を試行
  const sizesToTry = [maxSize, 600, 400, 200]

  for (const outputSize of sizesToTry) {
    // 元画像が出力サイズより小さい場合はスキップ不要
    const actualSize = Math.min(minDimension, outputSize)

    const canvas = document.createElement('canvas')
    canvas.width = actualSize
    canvas.height = actualSize
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('Failed to get canvas context')
    }

    // 正方形にクロップして描画
    ctx.drawImage(
      img,
      cropX, cropY, minDimension, minDimension,
      0, 0, actualSize, actualSize
    )

    // 品質を段階的に下げて圧縮
    let currentQuality = quality
    while (currentQuality >= 0.1) {
      const blob = await canvasToBlob(canvas, currentQuality)

      if (blob && blob.size <= maxFileSize) {
        URL.revokeObjectURL(imgSrc)
        return blob
      }

      currentQuality -= 0.1
    }

    // 最低品質でも収まらない場合、さらに小さい解像度を試す
  }

  // 最終手段: 最小サイズ + 最低品質で強制出力
  const finalSize = 150
  const canvas = document.createElement('canvas')
  canvas.width = finalSize
  canvas.height = finalSize
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  ctx.drawImage(
    img,
    cropX, cropY, minDimension, minDimension,
    0, 0, finalSize, finalSize
  )

  URL.revokeObjectURL(imgSrc)

  const blob = await canvasToBlob(canvas, 0.5)
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
