import { db } from '@/lib/db'

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

// Clean up expired entries periodically (every 10 minutes)
let cleanupScheduled = false
function scheduleCleanup() {
  if (cleanupScheduled) return
  cleanupScheduled = true
  setInterval(async () => {
    try {
      await db.rateLimitEntry.deleteMany({
        where: { windowEnd: { lt: new Date() } },
      })
    } catch {
      // Silently fail - cleanup is best-effort
    }
  }, 10 * 60 * 1000)
}

export async function rateLimit(
  identifier: string,
  options: { maxRequests: number; windowMs: number } = { maxRequests: 100, windowMs: 60 * 1000 }
): Promise<RateLimitResult> {
  scheduleCleanup()

  const now = new Date()
  const windowEnd = new Date(now.getTime() + options.windowMs)

  // Find or create the rate limit entry for this identifier within the current window
  // We look for the most recent entry that hasn't expired
  const existing = await db.rateLimitEntry.findFirst({
    where: {
      identifier,
      windowEnd: { gt: now },
    },
    orderBy: { windowStart: 'desc' },
  })

  if (existing && existing.windowStart < new Date(windowEnd.getTime() - options.windowMs)) {
    // Entry exists and is within the window
    if (existing.requestCount >= options.maxRequests) {
      return {
        success: false,
        remaining: 0,
        resetAt: existing.windowEnd.getTime(),
      }
    }

    // Increment the counter
    const updated = await db.rateLimitEntry.update({
      where: { id: existing.id },
      data: { requestCount: { increment: 1 } },
    })

    return {
      success: true,
      remaining: Math.max(0, options.maxRequests - updated.requestCount),
      resetAt: updated.windowEnd.getTime(),
    }
  }

  // Create a new window entry
  const entry = await db.rateLimitEntry.create({
    data: {
      identifier,
      windowStart: now,
      windowEnd,
      requestCount: 1,
    },
  })

  return {
    success: true,
    remaining: options.maxRequests - 1,
    resetAt: entry.windowEnd.getTime(),
  }
}
