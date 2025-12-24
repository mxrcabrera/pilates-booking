/**
 * Funciones de validación reutilizables
 */

const TIME_REGEX = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/

/**
 * Valida que horaInicio sea anterior a horaFin
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
 * Valida que una hora esté dentro de un rango de horario
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
