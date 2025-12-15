// ===========================================
// CONSTANTES - Pilates Booking
// ===========================================

export const PACK_LABELS: Record<string, string> = {
  'mensual': 'Mensual',
  'por_clase': 'Por Clase',
  'pack_4': 'Pack 4 Clases',
  'pack_8': 'Pack 8 Clases',
  'pack_12': 'Pack 12 Clases'
}

export const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export const DIAS_SEMANA_COMPLETO = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
]

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export const ESTADOS_CLASE = {
  RESERVADA: 'reservada',
  COMPLETADA: 'completada',
  CANCELADA: 'cancelada',
  NO_ASISTIO: 'no_asistio'
} as const

export const ESTADOS_PAGO = {
  PENDIENTE: 'pendiente',
  PAGADO: 'pagado'
} as const
