// ===========================================
// CONSTANTES - Pilates Booking
// ===========================================

export const PACK_LABELS: Record<string, string> = {
  'mensual': 'Mensual',
  'por_clase': 'Por Clase',
  'pack_4': 'Pack 4 Clases',
  'pack_8': 'Pack 8 Clases',
  'pack_12': 'Pack 12 Clases',
  '1x': '1 clase/semana',
  '2x': '2 clases/semana',
  '3x': '3 clases/semana',
  'clase': 'Clase suelta'
}

export const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export const DIAS_SEMANA_COMPLETO = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
]

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

// Estados de la CLASE (ciclo de vida de la clase)
export const ESTADOS_CLASE = {
  RESERVADA: 'reservada',
  COMPLETADA: 'completada',
  CANCELADA: 'cancelada'
} as const

export const ESTADO_LABELS: Record<string, string> = {
  reservada: 'Reservada',
  completada: 'Completada',
  cancelada: 'Cancelada'
}

// Asistencia del ALUMNO (si estuvo presente o no)
export const ASISTENCIA = {
  PENDIENTE: 'pendiente',
  PRESENTE: 'presente',
  AUSENTE: 'ausente'
} as const

export const ASISTENCIA_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  presente: 'Presente',
  ausente: 'Ausente'
}

export const ESTADOS_PAGO = {
  PENDIENTE: 'pendiente',
  PAGADO: 'pagado'
} as const
