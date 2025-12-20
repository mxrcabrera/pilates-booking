// lib/alumno-utils.ts
// Utilidades compartidas para manejo de estado de alumnos

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
 * Calcula el estado de pago de un alumno
 * Retorna null si el alumno está inactivo
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
  const dias = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

  if (dias < 0) {
    const diasAtraso = Math.abs(dias)
    // Más de 60 días = datos incorrectos, mostrar al día
    if (diasAtraso > 60) return { texto: 'Al día', clase: 'al-dia' }
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
 * Retorna el texto de estado considerando el género del alumno
 */
export function getStatusText(genero: string, estaActivo: boolean): string {
  if (genero === 'M') {
    return estaActivo ? 'Activo' : 'Inactivo'
  }
  return estaActivo ? 'Activa' : 'Inactiva'
}

/**
 * Calcula las clases restantes del mes
 * Retorna null si no hay clasesPorMes definido o no quedan clases
 */
export function getClasesRestantes(alumno: AlumnoClasesData): string | null {
  if (!alumno.clasesPorMes) return null
  const usadas = alumno.clasesEsteMes || 0
  const restantes = alumno.clasesPorMes - usadas
  if (restantes <= 0) return null
  return `${restantes} clase${restantes > 1 ? 's' : ''} restante${restantes > 1 ? 's' : ''}`
}

/**
 * Versión alternativa de clases restantes para vista de detalle
 * Incluye mensaje cuando no hay clases disponibles
 */
export function getClasesRestantesDetalle(alumno: AlumnoClasesData): string | null {
  if (!alumno.clasesPorMes) return null
  const usadas = alumno.clasesEsteMes || 0
  const restantes = alumno.clasesPorMes - usadas
  if (restantes <= 0) return 'Sin clases disponibles'
  return `${restantes} clase${restantes > 1 ? 's' : ''} restante${restantes > 1 ? 's' : ''}`
}
