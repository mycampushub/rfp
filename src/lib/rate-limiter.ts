/**
 * Simple in-memory rate limiter for API routes.
 * For production, replace with Redis-backed rate limiter.
 */
 
const requests = new Map<string, { count: number; resetAt: number }>()
 
// Cleanup stale entries every 5 minutes
if (typeof globalThis !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of requests) {
      if (now > entry.resetAt) requests.delete(key)
    }
  }, 5 * 60 * 1000)
}
 
export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}
 
/**
 * Check rate limit for a given identifier.
 * @param id - Unique identifier (e.g., userId, IP, endpoint+userId)
 * @param limit - Max requests in the window
 * @param windowMs - Time window in milliseconds (default: 60_000 = 1 minute)
 */
export function rateLimit(
  id: string,
  limit = 60,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now()
  const entry = requests.get(id)
 
  if (!entry || now > entry.resetAt) {
    const newEntry = { count: 1, resetAt: now + windowMs }
    requests.set(id, newEntry)
    return { success: true, remaining: limit - 1, resetAt: newEntry.resetAt }
  }
 
  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }
 
  entry.count++
  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}
 
/**
 * Rate limit specifically for login attempts (stricter limits).
 */
export function loginRateLimit(userId: string): RateLimitResult {
  return rateLimit(`login:${userId}`, 5, 15 * 60 * 1000) // 5 attempts per 15 min
}
