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
 * Verifica si una request está dentro del límite permitido
 *
 * @param key - Identificador único (ej: "login:192.168.1.1")
 * @param limit - Número máximo de requests permitidas
 * @param windowMs - Ventana de tiempo en milisegundos
 * @returns { success, remaining, resetIn }
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  // Si no hay registro o ya expiró, crear nuevo
  if (!record || now > record.resetTime) {
    if (rateLimitMap.size >= MAX_ENTRIES) {
      pruneExpired()
    }
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return { success: true, remaining: limit - 1, resetIn: windowMs }
  }

  // Si excede el límite
  if (record.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetIn: record.resetTime - now
    }
  }

  // Incrementar contador
  record.count++
  return {
    success: true,
    remaining: limit - record.count,
    resetIn: record.resetTime - now
  }
}

/**
 * Obtiene la IP del cliente desde los headers
 */
export function getClientIP(request: Request): string {
  // En Netlify/Vercel, x-forwarded-for contiene la IP real
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // Puede ser una lista separada por comas, tomar la primera
    return forwarded.split(',')[0].trim()
  }

  // Fallback para desarrollo local
  return 'localhost'
}

/**
 * Helper para crear respuesta de rate limit excedido
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
