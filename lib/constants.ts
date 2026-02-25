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

export const PLAN_NAMES: Record<string, string> = {
  FREE: 'Free',
  STARTER: 'Starter',
  PRO: 'Pro',
  ESTUDIO: 'Max'
}

export const ESTADO_LABELS: Record<string, string> = {
  reservada: 'Reservada',
  completada: 'Completada',
  cancelada: 'Cancelada'
}

export const ASISTENCIA_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  presente: 'Presente',
  ausente: 'Ausente'
}

// Magic numbers extracted as named constants
export const RECURRING_WEEKS = 8
export const OVERDUE_DAYS_THRESHOLD = 60
export const WEEKS_PER_MONTH = 4
export const WAITLIST_EXPIRY_MS = 2 * 60 * 60 * 1000 // 2 hours

// DIAS_SEMANA with objects for use in day selection components
export const DIAS_SEMANA_OPTIONS = [
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
  { value: 0, label: 'Domingo', short: 'Dom' }
]

