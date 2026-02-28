// Global client-side cache for page data.
// Data is kept in memory while the user navigates.

type CacheEntry<T> = {
  data: T
  timestamp: number
}

const cache = new Map<string, CacheEntry<unknown>>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function getCachedData<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null

  // Check if expired
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }

  return entry.data as T
}

export function setCachedData<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now()
  })
}

// Keys for each page
export const CACHE_KEYS = {
  ALUMNOS: 'alumnos-data',
  CALENDARIO: 'calendario-data',
  CONFIGURACION: 'configuracion-data',
  DASHBOARD: 'dashboard-data',
  PAGOS: 'pagos-data',
} as const

// Cache dependencies: when a key is invalidated, related keys are also invalidated
const CACHE_DEPENDENCIES: Record<string, string[]> = {
  [CACHE_KEYS.ALUMNOS]: [CACHE_KEYS.CALENDARIO, CACHE_KEYS.DASHBOARD, CACHE_KEYS.PAGOS],
  [CACHE_KEYS.CALENDARIO]: [CACHE_KEYS.DASHBOARD],
  [CACHE_KEYS.CONFIGURACION]: [CACHE_KEYS.CALENDARIO, CACHE_KEYS.DASHBOARD],
  [CACHE_KEYS.PAGOS]: [CACHE_KEYS.DASHBOARD],
}

// Invalidates cache with dependency cascade
export function invalidateCache(key?: string): void {
  if (key) {
    cache.delete(key)
    // Invalidate dependencies in cascade
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

