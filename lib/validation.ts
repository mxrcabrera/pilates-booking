/**
 * Funciones de validación reutilizables
 * Centralizan la lógica de validación para evitar duplicación
 */

// RFC 5322 simplified email regex - más preciso que el anterior
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

// Regex para validar formato de hora HH:MM
const TIME_REGEX = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/

/**
 * Valida si un email tiene formato válido
 * - Máximo 254 caracteres (RFC 5321)
 * - Formato RFC 5322 simplificado
 */
export function validateEmail(email: string): boolean {
  if (!email || email.length > 254) return false
  return EMAIL_REGEX.test(email)
}

/**
 * Valida que un valor requerido no esté vacío
 * @returns null si es válido, o mensaje de error si no lo es
 */
export function validateRequired(value: unknown, fieldName: string): string | null {
  if (value === null || value === undefined) {
    return `${fieldName} es obligatorio`
  }
  if (typeof value === 'string' && !value.trim()) {
    return `${fieldName} es obligatorio`
  }
  return null
}

/**
 * Valida que una fecha no esté en el pasado
 * @returns null si es válido, o mensaje de error si está en el pasado
 */
export function validateDateNotInPast(date: Date, horasAnticipacion: number = 0): string | null {
  const ahora = new Date()
  const tiempoMinimo = new Date(ahora.getTime() + horasAnticipacion * 60 * 60 * 1000)

  if (date < tiempoMinimo) {
    if (horasAnticipacion > 0) {
      const horasTexto = horasAnticipacion === 1 ? '1 hora' : `${horasAnticipacion} horas`
      return `Debe ser con al menos ${horasTexto} de anticipación`
    }
    return 'La fecha no puede estar en el pasado'
  }
  return null
}

/**
 * Valida que horaInicio sea anterior a horaFin
 * @returns null si es válido, o mensaje de error si no lo es
 */
export function validateTimeRange(horaInicio: string, horaFin: string): string | null {
  if (!TIME_REGEX.test(horaInicio) || !TIME_REGEX.test(horaFin)) {
    return 'Formato de hora inválido (usar HH:MM)'
  }
  if (horaInicio >= horaFin) {
    return 'La hora de inicio debe ser anterior a la hora de fin'
  }
  return null
}

/**
 * Valida que un string no exceda una longitud máxima
 * @returns null si es válido, o mensaje de error si excede
 */
export function validateMaxLength(value: string, max: number, fieldName: string): string | null {
  if (value.length > max) {
    return `${fieldName} no puede exceder ${max} caracteres`
  }
  return null
}

/**
 * Valida que un número esté dentro de un rango
 * @returns null si es válido, o mensaje de error si no lo es
 */
export function validateNumberRange(value: number, min: number, max: number, fieldName: string): string | null {
  if (isNaN(value)) {
    return `${fieldName} debe ser un número`
  }
  if (value < min || value > max) {
    return `${fieldName} debe estar entre ${min} y ${max}`
  }
  return null
}

/**
 * Valida que un precio sea válido (número >= 0)
 * @returns null si es válido, o mensaje de error si no lo es
 */
export function validatePrice(value: number | string): string | null {
  const precio = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(precio)) {
    return 'El precio debe ser un número'
  }
  if (precio < 0) {
    return 'El precio no puede ser negativo'
  }
  return null
}

/**
 * Valida que una hora esté dentro de un rango de horario
 * @returns null si es válido, o mensaje de error si no lo es
 */
export function validateTimeInRange(
  hora: string,
  horarioInicio: string,
  horarioFin: string,
  turnoNombre: string
): string | null {
  if (hora < horarioInicio || hora > horarioFin) {
    return `El horario de ${turnoNombre} configurado es de ${horarioInicio} a ${horarioFin}`
  }
  return null
}

/**
 * Valida múltiples campos y retorna el primer error encontrado
 */
export function validateAll(...validations: (string | null)[]): string | null {
  for (const error of validations) {
    if (error) return error
  }
  return null
}
