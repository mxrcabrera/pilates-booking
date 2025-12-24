import { revalidateTag } from 'next/cache'

// Next.js 16 requiere un segundo argumento (cacheLife profile)
// 'max' usa stale-while-revalidate para mejor performance

export function invalidatePacks() {
  revalidateTag('packs', 'max')
}

export function invalidateHorarios() {
  revalidateTag('horarios', 'max')
}

export function invalidateConfig() {
  revalidateTag('config', 'max')
}

export function invalidateAlumnos() {
  revalidateTag('alumnos', 'max')
}
