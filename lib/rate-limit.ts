/**
 * In-memory rate limiting to protect endpoints from abuse.
 *
 * WARNING: In-memory only — does NOT work across multiple serverless
 * instances (Vercel, Netlify Functions). Each cold start gets a fresh Map.
 * For distributed rate limiting, replace with Upstash Redis:
 *   https://upstash.com/docs/oss/sdks/ts/ratelimit/overview
 *
 * DEFERRED (M4): Migrating to Upstash Redis requires infrastructure
 * decision. Window constants are defined in lib/constants.ts
 * (RATE_LIMIT_WINDOW_MS). See qa-report.md for tracking.
 */

type RateLimitRecord = {
  count: number
  resetTime: number
}

const MAX_ENTRIES = 10_000
const rateLimitMap = new Map<string, RateLimitRecord>()

function pruneExpired() {
  const now = Date.now()
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}

// Cleanup every 5 minutes (only effective in long-running processes)
setInterval(pruneExpired, 5 * 60 * 1000)

/**
 * Checks if a request is within the allowed rate limit.
 *
 * @param key - Unique identifier (e.g. "login:192.168.1.1")
 * @param limit - Maximum number of allowed requests
 * @param windowMs - Time window in milliseconds
 * @returns { success, remaining, resetIn }
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  // No record or expired, create new entry
  if (!record || now > record.resetTime) {
    if (rateLimitMap.size >= MAX_ENTRIES) {
      pruneExpired()
    }
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return { success: true, remaining: limit - 1, resetIn: windowMs }
  }

  // Limit exceeded
  if (record.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetIn: record.resetTime - now
    }
  }

  // Increment counter
  record.count++
  return {
    success: true,
    remaining: limit - record.count,
    resetIn: record.resetTime - now
  }
}

/**
 * Gets the client IP from request headers.
 */
export function getClientIP(request: Request): string {
  // On Netlify/Vercel, x-forwarded-for contains the real IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // May be a comma-separated list, take the first one
    return forwarded.split(',')[0].trim()
  }

  // Fallback for local development
  return 'localhost'
}

/**
 * Helper to create a rate limit exceeded response.
 */
export function rateLimitExceeded(resetIn: number) {
  const retryAfter = Math.ceil(resetIn / 1000)
  return {
    error: `Demasiados intentos. Intentá de nuevo en ${retryAfter} segundos.`,
    status: 429,
    headers: {
      'Retry-After': retryAfter.toString(),
      'X-RateLimit-Remaining': '0',
    }
  }
}
