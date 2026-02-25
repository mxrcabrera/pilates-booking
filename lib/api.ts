// Helper functions for API calls

export async function apiCall(action: string, data: Record<string, unknown> = {}) {
  const response = await fetch('/api/v1/configuracion', {
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
  diaInicioCiclo?: number
}) {
  return apiCallTo('/api/v1/alumnos', 'create', data)
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
  diaInicioCiclo?: number
}) {
  return apiCallTo('/api/v1/alumnos', 'update', data)
}

export async function assignPackToAlumnoAPI(data: {
  id: string
  packType: string
  precio: number
}) {
  return apiCallTo('/api/v1/alumnos', 'update', data)
}

export async function toggleAlumnoStatusAPI(id: string) {
  return apiCallTo('/api/v1/alumnos', 'toggleStatus', { id })
}

export async function deleteAlumnoAPI(id: string) {
  return apiCallTo('/api/v1/alumnos', 'delete', { id })
}

export async function bulkDeleteAlumnosAPI(ids: string[]) {
  return apiCallTo('/api/v1/alumnos', 'bulkDelete', { ids })
}

export async function resetPasswordAlumnoAPI(data: { id: string; newPassword: string }) {
  return apiCallTo('/api/v1/alumnos', 'resetPassword', data)
}

// Clases
export async function createClaseAPI(data: {
  alumnoIds: string[]
  horaInicio: string
  horaRecurrente?: string
  esClasePrueba: boolean
  esRecurrente: boolean
  alumnosDias?: Record<string, number[]>
  fecha: string
}) {
  return apiCallTo('/api/v1/clases', 'create', data)
}

export async function updateClaseAPI(data: {
  id: string
  alumnoId?: string
  horaInicio: string
  horaRecurrente?: string
  estado: string
  esClasePrueba: boolean
  esRecurrente: boolean
  diasSemana?: number[]
  fecha: string
}) {
  return apiCallTo('/api/v1/clases', 'update', data)
}

export async function deleteClaseAPI(id: string) {
  return apiCallTo('/api/v1/clases', 'delete', { id })
}

export async function bulkDeleteClasesAPI(ids: string[]) {
  return apiCallTo('/api/v1/clases', 'bulkDelete', { ids })
}

export async function changeClaseStatusAPI(id: string, estado: string) {
  return apiCallTo('/api/v1/clases', 'changeStatus', { id, estado })
}

export async function changeAsistenciaAPI(id: string, asistencia: string) {
  return apiCallTo('/api/v1/clases', 'changeAsistencia', { id, asistencia })
}

export async function editSeriesAPI(data: {
  serieId: string
  diasSemana: number[]
  horaInicio: string
  scope: 'future' | 'all_unattended'
}) {
  return apiCallTo('/api/v1/clases', 'editSeries', data)
}

// Pagos
export async function createPagoAPI(data: {
  alumnoId: string
  monto: number
  fechaVencimiento: string
  mesCorrespondiente: string
}) {
  return apiCallTo('/api/v1/pagos', 'create', data)
}

export async function marcarPagadoAPI(id: string) {
  return apiCallTo('/api/v1/pagos', 'marcarPagado', { id })
}

export async function marcarPendienteAPI(id: string) {
  return apiCallTo('/api/v1/pagos', 'marcarPendiente', { id })
}

export async function deletePagoAPI(id: string) {
  return apiCallTo('/api/v1/pagos', 'delete', { id })
}

export async function bulkDeletePagosAPI(ids: string[]) {
  return apiCallTo('/api/v1/pagos', 'bulkDelete', { ids })
}
