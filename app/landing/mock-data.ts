import type { ClaseHoy, SiguienteClase, DashboardFeatures } from '@/lib/types'
import type { Clase, AlumnoSimple, Pack, CalendarioFeatures } from '@/lib/types'
import type { Alumno, PlanInfo, AlumnosFeatures } from '@/lib/types'
import type { Pago, AlumnoPago, PagosFeatures } from '@/lib/types'

// Dashboard mock data
export const mockDashboardFeatures: DashboardFeatures = {
  reportesBasicos: true,
  plan: 'STARTER'
}

export const mockClasesHoy: ClaseHoy[] = [
  {
    id: '1',
    horaInicio: '09:00',
    alumno: { nombre: 'María García' },
    asistencia: 'pendiente',
    estado: 'reservada',
    esClasePrueba: false
  },
  {
    id: '2',
    horaInicio: '09:00',
    alumno: { nombre: 'Carlos López' },
    asistencia: 'presente',
    estado: 'completada',
    esClasePrueba: false
  },
  {
    id: '3',
    horaInicio: '10:00',
    alumno: { nombre: 'Ana Martínez' },
    asistencia: 'pendiente',
    estado: 'reservada',
    esClasePrueba: true
  },
  {
    id: '4',
    horaInicio: '14:00',
    alumno: null,
    asistencia: 'pendiente',
    estado: 'reservada',
    esClasePrueba: false
  },
  {
    id: '5',
    horaInicio: '15:00',
    alumno: { nombre: 'Pedro Sánchez' },
    asistencia: 'ausente',
    estado: 'completada',
    esClasePrueba: false
  }
]

export const mockSiguienteClase: SiguienteClase = {
  hora: '10:00',
  cantAlumnos: 2,
  esMañana: false
}

// Calendario mock data
export const mockCalendarioFeatures: CalendarioFeatures = {
  clasesRecurrentes: true,
  listaEspera: true,
  plan: 'STARTER'
}

export const mockAlumnosSimple: AlumnoSimple[] = [
  { id: 'a1', nombre: 'María García', packType: 'p1', clasesPorSemana: 1 },
  { id: 'a2', nombre: 'Carlos López', packType: 'p2', clasesPorSemana: 2 },
  { id: 'a3', nombre: 'Ana Martínez', packType: 'p1', clasesPorSemana: 1 },
  { id: 'a4', nombre: 'Pedro Sánchez', packType: 'p3', clasesPorSemana: 3 },
  { id: 'a5', nombre: 'Laura Rodríguez', packType: 'p2', clasesPorSemana: 2 }
]

export const mockPacks: Pack[] = [
  { id: 'p1', nombre: 'Pack 4 clases', precio: '20000', clasesPorSemana: 1 },
  { id: 'p2', nombre: 'Pack 8 clases', precio: '36000', clasesPorSemana: 2 },
  { id: 'p3', nombre: 'Pack 12 clases', precio: '48000', clasesPorSemana: 3 }
]

export const mockClasesSemana: Clase[] = [
  {
    id: 'c1',
    fecha: new Date('2024-01-15'),
    horaInicio: '09:00',
    horaRecurrente: null,
    estado: 'reservada',
    asistencia: 'pendiente',
    esClasePrueba: false,
    esRecurrente: false,
    frecuenciaSemanal: null,
    diasSemana: [],
    serieId: null,
    profesorId: 'prof1',
    alumnoId: 'a1',
    alumno: { id: 'a1', nombre: 'María García', clasesPorMes: 4 },
    profesor: { id: 'prof1', nombre: 'Profesor Demo' },
    clasesUsadasEsteMes: 2
  },
  {
    id: 'c2',
    fecha: new Date('2024-01-15'),
    horaInicio: '10:00',
    horaRecurrente: null,
    estado: 'reservada',
    asistencia: 'pendiente',
    esClasePrueba: true,
    esRecurrente: false,
    frecuenciaSemanal: null,
    diasSemana: [],
    serieId: null,
    profesorId: 'prof1',
    alumnoId: 'a3',
    alumno: { id: 'a3', nombre: 'Ana Martínez', clasesPorMes: 4 },
    profesor: { id: 'prof1', nombre: 'Profesor Demo' },
    clasesUsadasEsteMes: 1
  },
  {
    id: 'c3',
    fecha: new Date('2024-01-16'),
    horaInicio: '09:00',
    horaRecurrente: null,
    estado: 'reservada',
    asistencia: 'pendiente',
    esClasePrueba: false,
    esRecurrente: false,
    frecuenciaSemanal: null,
    diasSemana: [],
    serieId: null,
    profesorId: 'prof1',
    alumnoId: 'a2',
    alumno: { id: 'a2', nombre: 'Carlos López', clasesPorMes: 8 },
    profesor: { id: 'prof1', nombre: 'Profesor Demo' },
    clasesUsadasEsteMes: 4
  },
  {
    id: 'c4',
    fecha: new Date('2024-01-16'),
    horaInicio: '14:00',
    horaRecurrente: null,
    estado: 'reservada',
    asistencia: 'pendiente',
    esClasePrueba: false,
    esRecurrente: false,
    frecuenciaSemanal: null,
    diasSemana: [],
    serieId: null,
    profesorId: 'prof1',
    alumnoId: null,
    alumno: null,
    profesor: { id: 'prof1', nombre: 'Profesor Demo' },
    clasesUsadasEsteMes: 0
  },
  {
    id: 'c5',
    fecha: new Date('2024-01-17'),
    horaInicio: '09:00',
    horaRecurrente: null,
    estado: 'reservada',
    asistencia: 'pendiente',
    esClasePrueba: false,
    esRecurrente: false,
    frecuenciaSemanal: null,
    diasSemana: [],
    serieId: null,
    profesorId: 'prof1',
    alumnoId: 'a4',
    alumno: { id: 'a4', nombre: 'Pedro Sánchez', clasesPorMes: 12 },
    profesor: { id: 'prof1', nombre: 'Profesor Demo' },
    clasesUsadasEsteMes: 0
  }
]

// Alumnos mock data
export const mockAlumnos: Alumno[] = [
  {
    id: 'a1',
    userId: null,
    nombre: 'María García',
    email: 'maria@email.com',
    telefono: '11-1234-5678',
    genero: 'F',
    cumpleanos: null,
    patologias: null,
    packType: 'p1',
    clasesPorMes: 4,
    precio: '5000',
    estaActivo: true,
    diaInicioCiclo: 1,
    saldoAFavor: '0',
    proximoPagoVencimiento: null,
    clasesEsteMes: 2,
    _count: { clases: 8, pagos: 2 }
  },
  {
    id: 'a2',
    userId: null,
    nombre: 'Carlos López',
    email: 'carlos@email.com',
    telefono: '11-2345-6789',
    genero: 'M',
    cumpleanos: null,
    patologias: null,
    packType: 'p2',
    clasesPorMes: 8,
    precio: '4500',
    estaActivo: true,
    diaInicioCiclo: 1,
    saldoAFavor: '0',
    proximoPagoVencimiento: null,
    clasesEsteMes: 4,
    _count: { clases: 12, pagos: 3 }
  },
  {
    id: 'a3',
    userId: null,
    nombre: 'Ana Martínez',
    email: 'ana@email.com',
    telefono: '11-3456-7890',
    genero: 'F',
    cumpleanos: null,
    patologias: null,
    packType: 'p1',
    clasesPorMes: 4,
    precio: '5000',
    estaActivo: true,
    diaInicioCiclo: 1,
    saldoAFavor: '0',
    proximoPagoVencimiento: null,
    clasesEsteMes: 1,
    _count: { clases: 4, pagos: 1 }
  },
  {
    id: 'a4',
    userId: null,
    nombre: 'Pedro Sánchez',
    email: 'pedro@email.com',
    telefono: '11-4567-8901',
    genero: 'M',
    cumpleanos: null,
    patologias: null,
    packType: 'p3',
    clasesPorMes: 12,
    precio: '4000',
    estaActivo: false,
    diaInicioCiclo: 1,
    saldoAFavor: '0',
    proximoPagoVencimiento: null,
    clasesEsteMes: 0,
    _count: { clases: 6, pagos: 2 }
  },
  {
    id: 'a5',
    userId: null,
    nombre: 'Laura Rodríguez',
    email: 'laura@email.com',
    telefono: '11-5678-9012',
    genero: 'F',
    cumpleanos: null,
    patologias: null,
    packType: 'p2',
    clasesPorMes: 8,
    precio: '4500',
    estaActivo: true,
    diaInicioCiclo: 1,
    saldoAFavor: '0',
    proximoPagoVencimiento: null,
    clasesEsteMes: 3,
    _count: { clases: 10, pagos: 2 }
  }
]

export const mockPlanInfo: PlanInfo = {
  plan: 'STARTER',
  trialEndsAt: null,
  currentAlumnos: 5,
  maxAlumnos: 20,
  canAddMore: true
}

export const mockAlumnosFeatures: AlumnosFeatures = {
  prorrateoAutomatico: true,
  exportarExcel: true,
  plan: 'STARTER'
}

// Pagos mock data
export const mockPagos: Pago[] = [
  {
    id: 'pg1',
    alumno: { id: 'a1', nombre: 'María García', email: 'maria@email.com' },
    monto: '20000',
    estado: 'pagado',
    fechaPago: '2024-01-10T00:00:00',
    fechaVencimiento: '2024-01-15T00:00:00',
    mesCorrespondiente: '2024-01',
    tipoPago: 'mensual',
    clasesEsperadas: 4,
    clasesCompletadas: 2
  },
  {
    id: 'pg2',
    alumno: { id: 'a2', nombre: 'Carlos López', email: 'carlos@email.com' },
    monto: '36000',
    estado: 'pendiente',
    fechaPago: null,
    fechaVencimiento: '2024-01-20T00:00:00',
    mesCorrespondiente: '2024-01',
    tipoPago: 'mensual',
    clasesEsperadas: 8,
    clasesCompletadas: 4
  },
  {
    id: 'pg3',
    alumno: { id: 'a3', nombre: 'Ana Martínez', email: 'ana@email.com' },
    monto: '20000',
    estado: 'pagado',
    fechaPago: '2024-01-08T00:00:00',
    fechaVencimiento: '2024-01-15T00:00:00',
    mesCorrespondiente: '2024-01',
    tipoPago: 'mensual',
    clasesEsperadas: 4,
    clasesCompletadas: 1
  },
  {
    id: 'pg4',
    alumno: { id: 'a4', nombre: 'Pedro Sánchez', email: 'pedro@email.com' },
    monto: '48000',
    estado: 'vencido',
    fechaPago: null,
    fechaVencimiento: '2024-01-05T00:00:00',
    mesCorrespondiente: '2024-01',
    tipoPago: 'mensual',
    clasesEsperadas: 12,
    clasesCompletadas: 0
  },
  {
    id: 'pg5',
    alumno: { id: 'a5', nombre: 'Laura Rodríguez', email: 'laura@email.com' },
    monto: '36000',
    estado: 'pendiente',
    fechaPago: null,
    fechaVencimiento: '2024-01-25T00:00:00',
    mesCorrespondiente: '2024-01',
    tipoPago: 'mensual',
    clasesEsperadas: 8,
    clasesCompletadas: 3
  }
]

export const mockAlumnosPago: AlumnoPago[] = [
  { id: 'a1', nombre: 'María García', precio: '5000', packType: 'p1', diaInicioCiclo: 1, saldoAFavor: '0' },
  { id: 'a2', nombre: 'Carlos López', precio: '4500', packType: 'p2', diaInicioCiclo: 1, saldoAFavor: '0' },
  { id: 'a3', nombre: 'Ana Martínez', precio: '5000', packType: 'p1', diaInicioCiclo: 1, saldoAFavor: '0' },
  { id: 'a4', nombre: 'Pedro Sánchez', precio: '4000', packType: 'p3', diaInicioCiclo: 1, saldoAFavor: '0' },
  { id: 'a5', nombre: 'Laura Rodríguez', precio: '4500', packType: 'p2', diaInicioCiclo: 1, saldoAFavor: '0' }
]

export const mockPagosFeatures: PagosFeatures = {
  exportarExcel: true,
  plan: 'STARTER'
}
