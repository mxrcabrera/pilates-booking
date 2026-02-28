// lib/dates/index.ts
// Utilidades para manejo de fechas

import { fromZonedTime } from 'date-fns-tz'
import { MS_PER_DAY, MESES } from '@/lib/constants'

export const ARGENTINA_TZ = 'America/Argentina/Buenos_Aires'

/**
 * Obtiene la fecha actual en timezone Argentina
 */
function now(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: ARGENTINA_TZ }))
}

/**
 * Converts a date string (YYYY-MM-DD) + time string (HH:MM) in Argentina
 * local time to a UTC Date object. Handles DST correctly.
 */
export function argentinaToUTC(fechaStr: string, horaStr: string): Date {
  return fromZonedTime(`${fechaStr}T${horaStr}:00`, ARGENTINA_TZ)
}

/**
 * Returns the current hour in Argentina timezone (0-23).
 */
export function getNowArgentinaHour(): number {
  const hourStr = new Date().toLocaleString('en-US', {
    timeZone: ARGENTINA_TZ,
    hour: 'numeric',
    hour12: false
  })
  return parseInt(hourStr)
}

/**
 * Formatea un mes en formato "YYYY-MM" a formato legible
 */
export function formatMes(mesStr: string): string {
  if (/^\d{4}-\d{2}$/.test(mesStr)) {
    const [year, month] = mesStr.split('-')
    return `${MESES[parseInt(month) - 1]} ${year}`
  }
  return mesStr
}

/**
 * Calcula la diferencia en días entre una fecha y hoy
 * Positivo = fecha en el futuro, Negativo = fecha en el pasado
 */
export function diasDiferencia(fecha: Date | string): number {
  const hoy = now()
  hoy.setHours(0, 0, 0, 0)

  const target = typeof fecha === 'string' ? new Date(fecha) : new Date(fecha)
  target.setHours(0, 0, 0, 0)

  return Math.ceil((target.getTime() - hoy.getTime()) / MS_PER_DAY)
}
