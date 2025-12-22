// ===========================================
// TIPOS CENTRALIZADOS - Pilates Booking
// ===========================================

// ----- ALUMNO -----
export type Alumno = {
  id: string
  nombre: string
  email: string
  telefono: string
  genero: string
  cumpleanos: string | null
  patologias: string | null
  packType: string
  clasesPorMes: number | null
  precio: string
  estaActivo: boolean
  consentimientoTutor?: boolean
  diaInicioCiclo: number
  saldoAFavor: string
  proximoPagoVencimiento: string | null
  clasesEsteMes: number
  _count: {
    clases: number
    pagos: number
  }
}

// Versión simplificada para selects y listas
export type AlumnoSimple = {
  id: string
  nombre: string
}

// Versión para clases (con datos del pack)
export type AlumnoClase = {
  id: string
  nombre: string
  clasesPorMes: number | null
}

// Versión para pagos (con precio y packType)
export type AlumnoPago = {
  id: string
  nombre: string
  precio: string
  packType: string
  diaInicioCiclo: number
  saldoAFavor: string
}

// ----- CLASE -----
export type ClaseAPI = {
  id: string
  fecha: string
  horaInicio: string
  horaRecurrente: string | null
  estado: string
  asistencia: string
  esClasePrueba: boolean
  esRecurrente: boolean
  frecuenciaSemanal: number | null
  diasSemana: number[]
  profesorId: string
  alumnoId: string | null
  alumno: AlumnoClase | null
  profesor: { id: string; nombre: string }
  clasesUsadasEsteMes: number
}

export type Clase = Omit<ClaseAPI, 'fecha'> & { fecha: Date }

export type ClaseHoy = {
  id: string
  horaInicio: string
  estado: string
  asistencia: string
  esClasePrueba: boolean
  alumno: { nombre: string } | null
}

// ----- PAGO -----
export type Pago = {
  id: string
  monto: string
  fechaPago: string | null
  fechaVencimiento: string
  estado: string
  mesCorrespondiente: string
  tipoPago: string // "mensual" (pack) o "clase"
  clasesEsperadas: number | null // Clases que debe hacer en el mes
  clasesCompletadas: number // Clases efectivamente hechas en el mes (calculado)
  alumno: {
    id: string
    nombre: string
    email: string
  }
}

// ----- PACK -----
export type Pack = {
  id: string
  nombre: string
  clasesPorSemana: number
  precio: string
}

// ----- HORARIO -----
export type Horario = {
  id: string
  diaSemana: number
  horaInicio: string
  horaFin: string
  esManiana: boolean
  estaActivo: boolean
}

// ----- PROFESOR / USER -----
export type Profesor = {
  id: string
  nombre: string
  email: string
  plan?: 'FREE' | 'STARTER' | 'PRO' | 'ESTUDIO'
  planName?: string
  inTrial?: boolean
  trialDaysLeft?: number
}

export type ProfesorConfig = {
  id: string
  horasAnticipacionMinima: number
  maxAlumnosPorClase: number
  horarioMananaInicio: string
  horarioMananaFin: string
  turnoMananaActivo: boolean
  horarioTardeInicio: string
  horarioTardeFin: string
  turnoTardeActivo: boolean
  espacioCompartidoId: string | null
  syncGoogleCalendar: boolean
  precioPorClase: string
  hasGoogleAccount: boolean
}

// ----- PAGINACIÓN -----
export type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export type PaginatedResponse<T> = {
  data: T[]
  pagination: Pagination
}

// ----- API RESPONSE TYPES -----
export type PreferencesIncompleteResponse = {
  preferencesIncomplete: true
  missingFields: string[]
}

// ----- DATA TYPES (para páginas) -----
// Incluyen formato legacy (alumnos, pagos, clases) y nuevo formato paginado (data, pagination)
export type PlanInfo = {
  plan: 'FREE' | 'STARTER' | 'PRO' | 'ESTUDIO'
  trialEndsAt: string | null
  maxAlumnos: number
  currentAlumnos: number
  canAddMore: boolean
}

export type AlumnosData = {
  // Nuevo formato paginado
  data: Alumno[]
  pagination: Pagination
  // Compatibilidad con formato anterior
  alumnos: Alumno[]
  packs: Pack[]
  precioPorClase: string
  planInfo: PlanInfo
}

export type CalendarioData = {
  // Nuevo formato paginado
  data: Clase[]
  pagination: Pagination
  // Compatibilidad con formato anterior
  clases: Clase[]
  alumnos: AlumnoSimple[]
  packs: Pack[]
  currentUserId: string
  horarioMananaInicio: string
  horarioMananaFin: string
  horarioTardeInicio: string
  horarioTardeFin: string
  precioPorClase: string
  maxAlumnosPorClase: number
  horasAnticipacionMinima: number
}

export type CalendarioDataCached = Omit<CalendarioData, 'clases' | 'data'> & {
  clases: ClaseAPI[]
  data: ClaseAPI[]
}

export type ConfigData = {
  profesor: ProfesorConfig
  horarios: Horario[]
  packs: Pack[]
}

export type PagosData = {
  // Nuevo formato paginado
  data: Pago[]
  pagination: Pagination
  // Compatibilidad con formato anterior
  pagos: Pago[]
  alumnos: AlumnoPago[]
}

export type SiguienteClase = {
  hora: string
  cantAlumnos: number
  esMañana: boolean
}

export type SetupStatus = {
  hasHorarios: boolean
  hasPacks: boolean
  hasAlumnos: boolean
  userName: string | null
}

export type DashboardData = {
  totalAlumnos: number
  clasesHoy: ClaseHoy[]
  pagosVencidos: number
  horarioTardeInicio: string
  maxAlumnosPorClase: number
  siguienteClase: SiguienteClase | null
  setupStatus: SetupStatus
}
