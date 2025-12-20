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

// Utilidades de tiempo/hora
export function getTurno(hora: number): 'mañana' | 'tarde' | 'noche' {
  if (hora < 12) return 'mañana'
  if (hora < 19) return 'tarde'
  return 'noche'
}

export function formatearHora(hora: string): string {
  return hora.substring(0, 5) // "08:00:00" → "08:00"
}

// Formatea cualquier fecha a YYYY-MM-DD
// - Strings de la DB: extraer directamente (vienen como "2025-12-19T00:00:00.000Z")
// - Date objects de la DB: usar UTC (getUTCDate) porque son medianoche UTC
// - Date objects locales (new Date()): usar local (getDate) porque representan el día del usuario
//
// El problema: no sabemos si un Date viene de la DB o es local.
// Solución: usamos la hora UTC para determinar el origen:
// - Si la hora UTC es 00:00:00.000 → viene de la DB, usar UTC
// - Si no → es fecha local, usar local
export function formatearFechaDia(fecha: Date | string): string {
  if (typeof fecha === 'string') {
    return fecha.split('T')[0]
  }

  // Detectar si es fecha de DB (medianoche UTC) o fecha local
  const esDeDB = fecha.getUTCHours() === 0 &&
                 fecha.getUTCMinutes() === 0 &&
                 fecha.getUTCSeconds() === 0 &&
                 fecha.getUTCMilliseconds() === 0

  if (esDeDB) {
    // Fecha de DB: usar UTC
    const year = fecha.getUTCFullYear()
    const month = String(fecha.getUTCMonth() + 1).padStart(2, '0')
    const day = String(fecha.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } else {
    // Fecha local: usar local
    const year = fecha.getFullYear()
    const month = String(fecha.getMonth() + 1).padStart(2, '0')
    const day = String(fecha.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}
