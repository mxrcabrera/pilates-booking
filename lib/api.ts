// Helper functions for API calls

export async function apiCall(action: string, data: Record<string, unknown> = {}) {
  const response = await fetch('/api/configuracion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...data }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Error en la operación')
  }

  return result
}

// Horarios
export async function saveHorarioAPI(data: {
  id?: string
  diaSemana: number
  horaInicio: string
  horaFin: string
  esManiana: boolean
}) {
  return apiCall('saveHorario', data)
}

export async function deleteHorarioAPI(id: string) {
  return apiCall('deleteHorario', { id })
}

export async function toggleHorarioAPI(id: string) {
  return apiCall('toggleHorario', { id })
}

export async function saveHorariosBatchAPI(horarios: Array<{
  diaSemana: number
  horaInicio: string
  horaFin: string
  esManiana: boolean
}>) {
  return apiCall('saveHorariosBatch', { horarios })
}

// Packs
export async function savePackAPI(data: {
  id?: string
  nombre: string
  clasesPorSemana: number
  precio: number
}) {
  return apiCall('savePack', data)
}

export async function deletePackAPI(id: string) {
  return apiCall('deletePack', { id })
}

// Profile
export async function updateProfileAPI(data: {
  nombre: string
  telefono: string
}) {
  return apiCall('updateProfile', data)
}

export async function changePasswordAPI(data: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}) {
  return apiCall('changePassword', data)
}

// Preferencias
export async function updatePreferenciasAPI(data: {
  horasAnticipacionMinima: number
  maxAlumnosPorClase: number
  horarioMananaInicio: string
  horarioMananaFin: string
  horarioTardeInicio: string
  horarioTardeFin: string
  espacioCompartidoId?: string
  syncGoogleCalendar: boolean
}) {
  return apiCall('updatePreferencias', data)
}

// Helper genérico para otras APIs
async function apiCallTo(endpoint: string, action: string, data: Record<string, unknown> = {}) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...data }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Error en la operación')
  }

  return result
}

// Alumnos
export async function createAlumnoAPI(data: {
  nombre: string
  email: string
  telefono: string
  cumpleanos?: string
  patologias?: string
  packType: string
  clasesPorMes?: number
  precio: number
}) {
  return apiCallTo('/api/alumnos', 'create', data)
}

export async function updateAlumnoAPI(data: {
  id: string
  nombre: string
  email: string
  telefono: string
  cumpleanos?: string
  patologias?: string
  packType: string
  clasesPorMes?: number
  precio: number
}) {
  return apiCallTo('/api/alumnos', 'update', data)
}

export async function toggleAlumnoStatusAPI(id: string) {
  return apiCallTo('/api/alumnos', 'toggleStatus', { id })
}

export async function deleteAlumnoAPI(id: string) {
  return apiCallTo('/api/alumnos', 'delete', { id })
}

// Clases
export async function createClaseAPI(data: {
  alumnoIds: string[]
  horaInicio: string
  horaRecurrente?: string
  esClasePrueba: boolean
  esRecurrente: boolean
  frecuenciaSemanal?: number
  diasSemana?: number[]
  fecha: string
}) {
  return apiCallTo('/api/clases', 'create', data)
}

export async function updateClaseAPI(data: {
  id: string
  alumnoId?: string
  horaInicio: string
  horaRecurrente?: string
  estado: string
  esClasePrueba: boolean
  esRecurrente: boolean
  frecuenciaSemanal?: number
  diasSemana?: number[]
  fecha: string
}) {
  return apiCallTo('/api/clases', 'update', data)
}

export async function deleteClaseAPI(id: string) {
  return apiCallTo('/api/clases', 'delete', { id })
}

export async function changeClaseStatusAPI(id: string, estado: string) {
  return apiCallTo('/api/clases', 'changeStatus', { id, estado })
}

export async function changeAsistenciaAPI(id: string, asistencia: string) {
  return apiCallTo('/api/clases', 'changeAsistencia', { id, asistencia })
}

// Pagos
export async function createPagoAPI(data: {
  alumnoId: string
  monto: number
  fechaVencimiento: string
  mesCorrespondiente: string
}) {
  return apiCallTo('/api/pagos', 'create', data)
}

export async function marcarPagadoAPI(id: string) {
  return apiCallTo('/api/pagos', 'marcarPagado', { id })
}

export async function marcarPendienteAPI(id: string) {
  return apiCallTo('/api/pagos', 'marcarPendiente', { id })
}

export async function deletePagoAPI(id: string) {
  return apiCallTo('/api/pagos', 'delete', { id })
}
