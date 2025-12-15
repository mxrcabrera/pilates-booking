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

// Versión para pagos (con precio y packType)
export type AlumnoPago = {
  id: string
  nombre: string
  precio: string
  packType: string
}

// ----- CLASE -----
export type ClaseAPI = {
  id: string
  fecha: string
  horaInicio: string
  horaRecurrente: string | null
  estado: string
  esClasePrueba: boolean
  esRecurrente: boolean
  frecuenciaSemanal: number | null
  diasSemana: number[]
  profesorId: string
  alumnoId: string | null
  alumno: AlumnoSimple | null
  profesor: { id: string; nombre: string }
}

export type Clase = Omit<ClaseAPI, 'fecha'> & { fecha: Date }

export type ClaseHoy = {
  id: string
  horaInicio: string
  estado: string
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
  estaActivo?: boolean
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
}

export type ProfesorConfig = {
  id: string
  horasAnticipacionMinima: number
  maxAlumnosPorClase: number
  horarioMananaInicio: string
  horarioMananaFin: string
  horarioTardeInicio: string
  horarioTardeFin: string
  espacioCompartidoId: string | null
  syncGoogleCalendar: boolean
  precioPorClase: string
  hasGoogleAccount: boolean
}

// ----- DATA TYPES (para páginas) -----
export type AlumnosData = {
  alumnos: Alumno[]
  packs: Pack[]
  precioPorClase: string
}

export type CalendarioData = {
  clases: Clase[]
  alumnos: AlumnoSimple[]
  currentUserId: string
  horarioMananaInicio: string
  horarioMananaFin: string
  horarioTardeInicio: string
  horarioTardeFin: string
}

export type CalendarioDataCached = Omit<CalendarioData, 'clases'> & {
  clases: ClaseAPI[]
}

export type ConfigData = {
  profesor: ProfesorConfig
  horarios: Horario[]
  packs: Pack[]
}

export type PagosData = {
  pagos: Pago[]
  alumnos: AlumnoPago[]
}

export type DashboardData = {
  totalAlumnos: number
  clasesHoy: ClaseHoy[]
  pagosVencidos: number
}
