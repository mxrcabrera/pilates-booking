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

// Keys para cada página
export const CACHE_KEYS = {
  ALUMNOS: 'alumnos-data',
  CALENDARIO: 'calendario-data',
  CONFIGURACION: 'configuracion-data',
  DASHBOARD: 'dashboard-data',
  PAGOS: 'pagos-data',
} as const

// Dependencias entre caches: cuando se invalida una key, también se invalidan las relacionadas
const CACHE_DEPENDENCIES: Record<string, string[]> = {
  [CACHE_KEYS.ALUMNOS]: [CACHE_KEYS.CALENDARIO, CACHE_KEYS.DASHBOARD, CACHE_KEYS.PAGOS],
  [CACHE_KEYS.CALENDARIO]: [CACHE_KEYS.DASHBOARD],
  [CACHE_KEYS.CONFIGURACION]: [CACHE_KEYS.CALENDARIO, CACHE_KEYS.DASHBOARD],
  [CACHE_KEYS.PAGOS]: [CACHE_KEYS.DASHBOARD],
}

// Invalida cache con cascada de dependencias
export function invalidateCache(key?: string): void {
  if (key) {
    cache.delete(key)
    // Invalidar dependencias en cascada
    const deps = CACHE_DEPENDENCIES[key]
    if (deps) {
      for (const dep of deps) {
        cache.delete(dep)
      }
    }
  } else {
    cache.clear()
  }
}

// Invalida múltiples keys a la vez (sin duplicados)
export function invalidateCaches(...keys: string[]): void {
  const toInvalidate = new Set<string>()

  for (const key of keys) {
    toInvalidate.add(key)
    const deps = CACHE_DEPENDENCIES[key]
    if (deps) {
      for (const dep of deps) {
        toInvalidate.add(dep)
      }
    }
  }

  for (const key of toInvalidate) {
    cache.delete(key)
  }
}
