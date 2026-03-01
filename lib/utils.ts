import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extrae el mensaje de error de una excepción de tipo desconocido
 * Uso: catch (error) { const msg = getErrorMessage(error) }
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Error desconocido'
}

// Time/hour utilities
export function getTurno(hora: number, horarioTardeInicio: string = '17:00'): 'mañana' | 'tarde' | 'noche' {
  const tardeComienzo = parseInt(horarioTardeInicio.split(':')[0])
  if (hora < tardeComienzo) return 'mañana'
  if (hora < 22) return 'tarde'
  return 'noche'
}

export function formatearHora(hora: string): string {
  return hora.substring(0, 5) // "08:00:00" → "08:00"
}

// Format any date to YYYY-MM-DD
// - DB strings: extract directly (come as "2025-12-19T00:00:00.000Z")
// - DB Date objects: use UTC (getUTCDate) because they're midnight UTC
// - Local Date objects (new Date()): use local (getDate) because they represent user's day
//
// The problem: we don't know if a Date comes from DB or is local.
// Solution: use UTC time to determine origin:
// - If UTC time is 00:00:00.000 → from DB, use UTC
// - Otherwise → local date, use local
export function formatearFechaDia(fecha: Date | string): string {
  if (typeof fecha === 'string') {
    return fecha.split('T')[0]
  }

  // Detect if it's a DB date (midnight UTC) or local date
  const esDeDB = fecha.getUTCHours() === 0 &&
                 fecha.getUTCMinutes() === 0 &&
                 fecha.getUTCSeconds() === 0 &&
                 fecha.getUTCMilliseconds() === 0

  if (esDeDB) {
    // DB date: use UTC
    const year = fecha.getUTCFullYear()
    const month = String(fecha.getUTCMonth() + 1).padStart(2, '0')
    const day = String(fecha.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } else {
    // Local date: use local
    const year = fecha.getFullYear()
    const month = String(fecha.getMonth() + 1).padStart(2, '0')
    const day = String(fecha.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}
