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

export type AlumnosFeatures = {
  prorrateoAutomatico: boolean
  exportarExcel: boolean
  plan: 'FREE' | 'STARTER' | 'PRO' | 'ESTUDIO'
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
  features: AlumnosFeatures
}

export type CalendarioFeatures = {
  clasesRecurrentes: boolean
  listaEspera: boolean
  plan: 'FREE' | 'STARTER' | 'PRO' | 'ESTUDIO'
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
  features: CalendarioFeatures
}

export type CalendarioDataCached = Omit<CalendarioData, 'clases' | 'data'> & {
  clases: ClaseAPI[]
  data: ClaseAPI[]
}

export type ConfigFeatures = {
  configuracionHorarios: boolean
  googleCalendarSync: boolean
  plan: 'FREE' | 'STARTER' | 'PRO' | 'ESTUDIO'
}

export type ConfigData = {
  profesor: ProfesorConfig
  horarios: Horario[]
  packs: Pack[]
  features: ConfigFeatures
}

export type PagosFeatures = {
  exportarExcel: boolean
  plan: 'FREE' | 'STARTER' | 'PRO' | 'ESTUDIO'
}

export type PagosData = {
  // Nuevo formato paginado
  data: Pago[]
  pagination: Pagination
  // Compatibilidad con formato anterior
  pagos: Pago[]
  alumnos: AlumnoPago[]
  features: PagosFeatures
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

export type DashboardFeatures = {
  reportesBasicos: boolean
  plan: 'FREE' | 'STARTER' | 'PRO' | 'ESTUDIO'
}

export type DashboardData = {
  totalAlumnos: number
  clasesHoy: ClaseHoy[]
  pagosVencidos: number
  horarioTardeInicio: string
  maxAlumnosPorClase: number
  siguienteClase: SiguienteClase | null
  setupStatus: SetupStatus
  features: DashboardFeatures
}

export type ReportesData = {
  canAccess: boolean
  metricas: {
    alumnosActivos: number
    alumnosTrend: number
    ingresosMes: number
    ingresosTrend: number
    clasesDictadas: number
    clasesTrend: number
  }
  asistencia: {
    presentes: number
    ausentes: number
    tasaAsistencia: number
  }
  pagos: {
    pagados: number
    pendientes: number
    vencidos: number
  }
  ocupacion: {
    promedio: number
    horasPico: string
    diaPico: string
  }
  graficos?: {
    historico: Array<{
      mes: string
      ingresos: number
      clases: number
      alumnos: number
    }>
    asistenciaPorDia: Array<{
      dia: string
      clases: number
      asistencia: number
    }>
    distribucionPacks: Array<{
      pack: string
      cantidad: number
    }>
    horarios: Array<{
      hora: string
      cantidad: number
    }>
  }
  avanzados?: {
    proyeccionIngresos: number
    ingresosPorAlumno: number
    tasaRetencion: number
    comparativaAnual: {
      ingresosEsteAño: number
      ingresosAñoAnterior: number
      variacion: number
    }
    topAlumnos: Array<{
      nombre: string
      clases: number
      asistencia: number
    }>
  }
}
