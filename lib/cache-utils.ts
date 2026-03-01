import { revalidateTag } from 'next/cache'

// Next.js 16 requires a second argument (cacheLife profile)
// 'max' uses stale-while-revalidate for better performance

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
