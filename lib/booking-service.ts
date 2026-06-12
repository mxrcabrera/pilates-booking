import { prisma } from '@/lib/prisma'

/**
 * Error personalizado para capacidad insuficiente
 */
export class InsufficientCapacityError extends Error {
  constructor(message: string = 'No hay cupos disponibles para esta clase') {
    super(message)
    this.name = 'InsufficientCapacityError'
  }
}

/**
 * Error personalizado para clase no encontrada
 */
export class ClassNotFoundError extends Error {
  constructor(message: string = 'Clase no encontrada') {
    super(message)
    this.name = 'ClassNotFoundError'
  }
}

/**
 * Error personalizado para reserva duplicada
 */
export class DuplicateReservationError extends Error {
  constructor(message: string = 'El alumno ya tiene una reserva para esta clase') {
    super(message)
    this.name = 'DuplicateReservationError'
  }
}

/**
 * Verifica si hay disponibilidad para reservar en una clase
 * @param claseId - ID de la clase a verificar
 * @returns true si hay cupo, false si no
 * @throws ClassNotFoundError si la clase no existe
 */
export async function verificarDisponibilidad(claseId: string): Promise<boolean> {
  const clase = await prisma.clase.findUnique({
    where: { id: claseId },
    select: {
      id: true,
      cuposMaximos: true,
      fecha: true,
      horaInicio: true,
      serieId: true,
      estudioId: true,
    },
  })

  if (!clase) {
    throw new ClassNotFoundError()
  }

  // Contar cuántas reservas existen para esta clase
  // Si tiene serieId, contar todas las clases de la serie
  // Si no tiene serieId, contar solo esta clase específica
  const whereClause: { deletedAt: Date | null; alumnoId: { not: null }; serieId?: string; id?: string } = {
    deletedAt: null,
    alumnoId: { not: null }, // Solo clases con alumno asignado (reservadas)
  }

  if (clase.serieId) {
    whereClause.serieId = clase.serieId
  } else {
    whereClause.id = claseId
  }

  const reservasExistentes = await prisma.clase.count({
    where: whereClause,
  })

  const hayCupo = reservasExistentes < clase.cuposMaximos

  return hayCupo
}

/**
 * Crea una reserva de forma atómica
 * @param estudioId - ID del estudio (para multi-tenant)
 * @param alumnoId - ID del alumno
 * @param claseId - ID de la clase a reservar
 * @returns La reserva creada
 * @throws InsufficientCapacityError si no hay cupo
 * @throws ClassNotFoundError si la clase no existe
 * @throws DuplicateReservationError si el alumno ya tiene reserva
 */
export async function crearReserva(
  estudioId: string,
  alumnoId: string,
  claseId: string
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Obtener la clase y verificar disponibilidad
    const clase = await tx.clase.findUnique({
      where: { id: claseId },
      select: {
        id: true,
        profesorId: true,
        cuposMaximos: true,
        fecha: true,
        horaInicio: true,
        serieId: true,
        estudioId: true,
        estado: true,
      },
    })

    if (!clase) {
      throw new ClassNotFoundError()
    }

    // Verificar que la clase pertenece al estudio (multi-tenant)
    if (clase.estudioId && clase.estudioId !== estudioId) {
      throw new Error('La clase no pertenece a este estudio')
    }

    // Verificar disponibilidad
    const whereClause: { deletedAt: Date | null; alumnoId: { not: null }; serieId?: string; id?: string } = {
      deletedAt: null,
      alumnoId: { not: null },
    }

    if (clase.serieId) {
      whereClause.serieId = clase.serieId
    } else {
      whereClause.id = claseId
    }

    const reservasExistentes = await tx.clase.count({
      where: whereClause,
    })

    if (reservasExistentes >= clase.cuposMaximos) {
      throw new InsufficientCapacityError(
        `No hay cupos disponibles. Máximo: ${clase.cuposMaximos}, Reservados: ${reservasExistentes}`
      )
    }

    // Verificar que el alumno no tenga reserva duplicada
    const whereClauseDuplicado: { deletedAt: Date | null; alumnoId: string; serieId?: string; id?: string } = {
      deletedAt: null,
      alumnoId,
    }

    if (clase.serieId) {
      whereClauseDuplicado.serieId = clase.serieId
    } else {
      whereClauseDuplicado.id = claseId
    }

    const reservaExistente = await tx.clase.findFirst({
      where: whereClauseDuplicado,
    })

    if (reservaExistente) {
      throw new DuplicateReservationError()
    }

    // 2. Crear la reserva (crear nuevo registro de Clase con alumno asignado)
    const reserva = await tx.clase.create({
      data: {
        profesorId: clase.profesorId,
        estudioId: clase.estudioId,
        alumnoId,
        fecha: clase.fecha,
        horaInicio: clase.horaInicio,
        estado: 'reservada',
        asistencia: 'pendiente',
        serieId: clase.serieId,
      },
    })

    return reserva
  })
}

/**
 * Cancela una reserva de forma atómica
 * @param estudioId - ID del estudio (para multi-tenant)
 * @param alumnoId - ID del alumno
 * @param claseId - ID de la clase a cancelar
 * @returns La reserva cancelada
 */
export async function cancelarReserva(
  estudioId: string,
  alumnoId: string,
  claseId: string
) {
  return await prisma.$transaction(async (tx) => {
    // Buscar la reserva
    const reserva = await tx.clase.findFirst({
      where: {
        id: claseId,
        alumnoId,
        deletedAt: null,
      },
    })

    if (!reserva) {
      throw new Error('Reserva no encontrada')
    }

    // Verificar que pertenece al estudio
    if (reserva.estudioId && reserva.estudioId !== estudioId) {
      throw new Error('La reserva no pertenece a este estudio')
    }

    // Soft delete (marcar como deleted)
    await tx.clase.update({
      where: { id: reserva.id },
      data: { deletedAt: new Date() },
    })

    return reserva
  })
}

/**
 * Obtiene las reservas de un alumno
 * @param estudioId - ID del estudio (para multi-tenant)
 * @param alumnoId - ID del alumno
 * @returns Lista de reservas
 */
export async function obtenerReservasAlumno(
  estudioId: string,
  alumnoId: string
) {
  const reservas = await prisma.clase.findMany({
    where: {
      alumnoId,
      estudioId,
      deletedAt: null,
      fecha: { gte: new Date() }, // Solo reservas futuras
    },
    include: {
      profesor: {
        select: { id: true, nombre: true },
      },
    },
    orderBy: { fecha: 'asc' },
  })

  return reservas
}

/**
 * Obtiene las reservas de un estudio (para profesores/owners)
 * @param estudioId - ID del estudio
 * @param fecha - Fecha opcional para filtrar
 * @returns Lista de reservas
 */
export async function obtenerReservasEstudio(
  estudioId: string,
  fecha?: Date
) {
  const where: { estudioId: string; deletedAt: Date | null; alumnoId: { not: null }; fecha?: Date | { gte: Date } } = {
    estudioId,
    deletedAt: null,
    alumnoId: { not: null },
  }

  if (fecha) {
    where.fecha = fecha
  } else {
    where.fecha = { gte: new Date() }
  }

  const reservas = await prisma.clase.findMany({
    where,
    include: {
      alumno: {
        select: { id: true, nombre: true, email: true, telefono: true },
      },
      profesor: {
        select: { id: true, nombre: true },
      },
    },
    orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }],
  })

  return reservas
}
