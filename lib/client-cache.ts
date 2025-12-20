// Cache global del cliente para datos de páginas
// Los datos se mantienen en memoria mientras el usuario navega

type CacheEntry<T> = {
  data: T
  timestamp: number
}

const cache = new Map<string, CacheEntry<any>>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

export function getCachedData<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null

  // Verificar si expiró
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }

  return entry.data
}

export function setCachedData<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now()
  })
}

export function invalidateCache(key?: string): void {
  if (key) {
    cache.delete(key)
  } else {
    cache.clear()
  }
}

// Keys para cada página
export const CACHE_KEYS = {
  ALUMNOS: 'alumnos-data',
  CALENDARIO: 'calendario-data',
  CONFIGURACION: 'configuracion-data',
  DASHBOARD: 'dashboard-data',
  PAGOS: 'pagos-data',
} as const
