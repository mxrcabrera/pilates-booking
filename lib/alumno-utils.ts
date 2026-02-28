import { OVERDUE_DAYS_THRESHOLD, WEEKS_PER_MONTH, MS_PER_DAY } from '@/lib/constants'

type PaymentStatus = {
  texto: string
  clase: 'al-dia' | 'por-vencer' | 'vencido'
} | null

interface AlumnoPaymentData {
  estaActivo: boolean
  proximoPagoVencimiento?: string | null
}

interface AlumnoClasesData {
  clasesPorMes?: number | null
  clasesEsteMes?: number
}

/**
 * Calculates the payment status of an alumno.
 * Returns null if the alumno is inactive.
 */
export function getPaymentStatus(alumno: AlumnoPaymentData): PaymentStatus {
  if (!alumno.estaActivo) return null

  if (!alumno.proximoPagoVencimiento) {
    return { texto: 'Al día', clase: 'al-dia' }
  }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const vencimiento = new Date(alumno.proximoPagoVencimiento)
  vencimiento.setHours(0, 0, 0, 0)
  const dias = Math.ceil((vencimiento.getTime() - hoy.getTime()) / MS_PER_DAY)

  if (dias < 0) {
    const diasAtraso = Math.abs(dias)
    // Over 60 days overdue = likely incorrect data, show as up-to-date
    if (diasAtraso > OVERDUE_DAYS_THRESHOLD) return { texto: 'Al día', clase: 'al-dia' }
    return { texto: 'Pago atrasado', clase: 'vencido' }
  }

  if (dias === 0) {
    return { texto: 'Vence hoy', clase: 'vencido' }
  }

  if (dias <= 7) {
    return { texto: `Vence en ${dias}d`, clase: 'por-vencer' }
  }

  return { texto: 'Al día', clase: 'al-dia' }
}

/**
 * Returns the status text considering the alumno's gender
 */
export function getStatusText(genero: string, estaActivo: boolean): string {
  if (genero === 'M') {
    return estaActivo ? 'Activo' : 'Inactivo'
  }
  return estaActivo ? 'Activa' : 'Inactiva'
}

/**
 * Calculates remaining classes for the month.
 * Returns null if clasesPorMes is not defined or no classes remain.
 */
export function getClasesRestantes(alumno: AlumnoClasesData): string | null {
  if (!alumno.clasesPorMes) return null
  const usadas = alumno.clasesEsteMes || 0
  const restantes = alumno.clasesPorMes - usadas
  if (restantes <= 0) return null
  return `${restantes} clase${restantes > 1 ? 's' : ''} restante${restantes > 1 ? 's' : ''}`
}

/**
 * Alternative version of remaining classes for detail view.
 * Includes a message when no classes are available.
 */
export function getClasesRestantesDetalle(alumno: AlumnoClasesData): string | null {
  if (!alumno.clasesPorMes) return null
  const usadas = alumno.clasesEsteMes || 0
  const restantes = alumno.clasesPorMes - usadas
  if (restantes <= 0) return 'Sin clases disponibles'
  return `${restantes} clase${restantes > 1 ? 's' : ''} restante${restantes > 1 ? 's' : ''}`
}

// ========================================
// BILLING CYCLE FUNCTIONS
// ========================================

export type RangoCiclo = {
  inicio: Date
  fin: Date
}

/**
 * Calculates the billing cycle range for an alumno
 * based on their custom cycle start day.
 *
 * @param diaInicioCiclo - Day of the month the cycle starts (1-28)
 * @param fechaReferencia - Reference date to calculate from (default: today)
 * @returns Object with start and end dates of the current cycle
 */
export function calcularRangoCiclo(diaInicioCiclo: number, fechaReferencia: Date = new Date()): RangoCiclo {
  const dia = Math.min(Math.max(1, diaInicioCiclo), 28)

  const año = fechaReferencia.getFullYear()
  const mes = fechaReferencia.getMonth()
  const diaActual = fechaReferencia.getDate()

  let inicio: Date
  let fin: Date

  if (diaActual >= dia) {
    // Current cycle started this month
    inicio = new Date(año, mes, dia)
    fin = new Date(año, mes + 1, dia - 1)
  } else {
    // Current cycle started last month
    inicio = new Date(año, mes - 1, dia)
    fin = new Date(año, mes, dia - 1)
  }

  // Set hours to include the full day
  inicio.setHours(0, 0, 0, 0)
  fin.setHours(23, 59, 59, 999)

  return { inicio, fin }
}

/**
 * Calculates the implicit price per class based on the pack price
 * and the number of classes per week (4 weeks per month).
 */
export function calcularPrecioImplicitoPorClase(precioPack: number, clasesPorSemana: number): number {
  const clasesPorMes = clasesPorSemana * WEEKS_PER_MONTH
  return precioPack / clasesPorMes
}
