// lib/dates/index.ts
// Utilidades para manejo de fechas

const ARGENTINA_TZ = 'America/Argentina/Buenos_Aires'

const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

/**
 * Obtiene la fecha actual en timezone Argentina
 */
function now(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: ARGENTINA_TZ }))
}

/**
 * Formatea un mes en formato "YYYY-MM" a formato legible
 */
export function formatMes(mesStr: string): string {
  if (/^\d{4}-\d{2}$/.test(mesStr)) {
    const [year, month] = mesStr.split('-')
    return `${MESES_ES[parseInt(month) - 1]} ${year}`
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

  return Math.ceil((target.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}
