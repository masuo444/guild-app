// 本番環境ではログを抑制するロガーユーティリティ

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },

  error: (...args: unknown[]) => {
    if (isDevelopment) {
      console.error(...args)
    }
    // 本番環境では外部モニタリングサービスに送信することを推奨
    // 例: Sentry.captureException(args[0])
  },

  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },

  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args)
    }
  },
}
