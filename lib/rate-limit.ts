/**
 * Rate limiting en memoria para proteger endpoints de abuso
 *
 * Limitaciones:
 * - Solo funciona en una instancia (no distribuido)
 * - Se resetea al reiniciar el servidor
 * - Para producción con múltiples instancias, usar Upstash Redis
 */

type RateLimitRecord = {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitRecord>()

// Limpiar registros expirados cada 5 minutos
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 5 * 60 * 1000)

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
