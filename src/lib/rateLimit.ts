/**
 * In-memory sliding window rate limiter.
 * Each instance tracks requests per key (email, userId, etc.).
 */

interface RateLimiterOptions {
  /** Maximum number of requests allowed within the window */
  maxRequests: number
  /** Window size in seconds */
  windowSeconds: number
}

const stores = new Map<string, Map<string, number[]>>()

export function rateLimit(name: string, options: RateLimiterOptions) {
  if (!stores.has(name)) {
    stores.set(name, new Map())
  }
  const store = stores.get(name)!

  return {
    /** Returns true if the request is allowed, false if rate-limited */
    check(key: string): boolean {
      const now = Date.now()
      const windowMs = options.windowSeconds * 1000
      const timestamps = store.get(key) ?? []

      // Remove expired entries
      const valid = timestamps.filter((t) => now - t < windowMs)

      if (valid.length >= options.maxRequests) {
        store.set(key, valid)
        return false
      }

      valid.push(now)
      store.set(key, valid)
      return true
    },
  }
}

// Pre-configured limiters
export const otpSendLimiter = rateLimit('otp-send', { maxRequests: 3, windowSeconds: 300 })
export const otpVerifyLimiter = rateLimit('otp-verify', { maxRequests: 5, windowSeconds: 300 })
export const exchangeLimiter = rateLimit('exchange', { maxRequests: 5, windowSeconds: 60 })
export const loginBonusLimiter = rateLimit('login-bonus', { maxRequests: 3, windowSeconds: 60 })
