// lib/dates/index.ts
// Utilidades centralizadas para manejo de fechas con timezone Argentina

const ARGENTINA_TZ = 'America/Argentina/Buenos_Aires'

const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const DIAS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

/**
 * Obtiene la fecha actual en timezone Argentina
 */
export function now(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: ARGENTINA_TZ }))
}

/**
 * Convierte una fecha a timezone Argentina
 */
export function toArgentinaTime(date: Date): Date {
  return new Date(date.toLocaleString('en-US', { timeZone: ARGENTINA_TZ }))
}

/**
 * Formatea una fecha a string en formato argentino
 */
export function toArgentinaString(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleString('es-AR', {
    timeZone: ARGENTINA_TZ,
    ...options
  })
}

/**
 * Formatea fecha en diferentes formatos
 */
export function formatDate(date: Date, format: 'short' | 'long' | 'iso' | 'dia-mes' = 'short'): string {
  const d = toArgentinaTime(date)

  switch (format) {
    case 'short':
      return d.toLocaleDateString('es-AR')
    case 'long':
      return d.toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    case 'iso':
      return d.toISOString().split('T')[0]
    case 'dia-mes':
      return `${d.getDate()} de ${MESES_ES[d.getMonth()]}`
    default:
      return d.toLocaleDateString('es-AR')
  }
}

/**
 * Formatea hora de string "HH:MM" o "HH:MM:SS" a "HH:MM"
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  return `${hours}:${minutes}`
}

/**
 * Formatea hora para mostrar (ej: "08:00" -> "8:00")
 */
export function formatHoraDisplay(hora: string): string {
  const [h, m] = hora.split(':')
  return `${parseInt(h)}:${m}`
}

/**
 * Formatea un mes en formato "YYYY-MM" o texto a formato legible
 */
export function formatMes(mesStr: string): string {
  // Formato numérico: "2024-12" -> "Diciembre 2024"
  if (/^\d{4}-\d{2}$/.test(mesStr)) {
    const [year, month] = mesStr.split('-')
    return `${MESES_ES[parseInt(month) - 1]} ${year}`
  }
  // Ya está en formato texto, retornar como está
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

/**
 * Verifica si una fecha es anterior a ahora
 */
export function isBeforeNow(date: Date): boolean {
  return date < now()
}

/**
 * Verifica si dos fechas son el mismo día
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  const d1 = toArgentinaTime(date1)
  const d2 = toArgentinaTime(date2)
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

/**
 * Calcula las horas hasta una fecha
 */
export function getHoursUntil(date: Date): number {
  const ahora = now()
  return (date.getTime() - ahora.getTime()) / (1000 * 60 * 60)
}

/**
 * Retorna el inicio del día (00:00:00)
 */
export function startOfDay(date: Date = new Date()): Date {
  const d = toArgentinaTime(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Retorna el fin del día (23:59:59)
 */
export function endOfDay(date: Date = new Date()): Date {
  const d = toArgentinaTime(date)
  d.setHours(23, 59, 59, 999)
  return d
}

/**
 * Retorna el nombre del día de la semana
 */
export function getDiaSemana(date: Date, formato: 'largo' | 'corto' = 'largo'): string {
  const d = toArgentinaTime(date)
  return formato === 'largo' ? DIAS_ES[d.getDay()] : DIAS_CORTOS[d.getDay()]
}

/**
 * Retorna el nombre del mes
 */
export function getNombreMes(date: Date): string {
  const d = toArgentinaTime(date)
  return MESES_ES[d.getMonth()]
}

/**
 * Formatea fecha para comparación (YYYY-MM-DD)
 */
export function formatearFechaDia(date: Date): string {
  const d = toArgentinaTime(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Crea una fecha con día específico del mes
 */
export function crearFechaVencimiento(anio: number, mes: number, dia: number = 10): Date {
  return new Date(anio, mes, dia)
}

// Re-exportar constantes útiles
export { MESES_ES as MESES, DIAS_ES as DIAS, DIAS_CORTOS }
