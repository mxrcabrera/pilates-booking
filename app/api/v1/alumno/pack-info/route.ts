import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { unauthorized, serverError } from '@/lib/api-utils'
import { calcularClasesRestantes, calcularClasesRecuperadas } from '@/lib/pack-utils'

export async function GET() {
  try {
    const userId = await getCurrentUser()
    if (!userId) {
      return unauthorized()
    }

    const alumno = await prisma.alumno.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true, profesorId: true, estudioId: true, packType: true, clasesPorMes: true }
    })

    if (!alumno) {
      return serverError('No se encontró el alumno')
    }

    // Usar el profesorId del alumno o buscar un profesor del estudio
    let profesorId: string | null = alumno.profesorId || null
    if (!profesorId && alumno.estudioId) {
      const estudioProfesor = await prisma.estudioMiembro.findFirst({
        where: { estudioId: alumno.estudioId, deletedAt: null },
        select: { userId: true }
      })
      profesorId = estudioProfesor?.userId || null
    }

    if (!profesorId) {
      return serverError('No se encontró profesor asociado')
    }

    const clasesInfo = await calcularClasesRestantes(alumno.id, profesorId)
    const recuperadasInfo = await calcularClasesRecuperadas(alumno.id, profesorId)

    return NextResponse.json({
      packType: alumno.packType,
      clasesPorMes: alumno.clasesPorMes,
      clasesRestantes: clasesInfo.restantes,
      clasesUsadas: clasesInfo.usadas,
      clasesRecuperadas: recuperadasInfo.recuperadas,
      limiteRecuperadas: recuperadasInfo.limite,
      puedeRecuperar: recuperadasInfo.puedeRecuperar
    })
  } catch (error) {
    return serverError(error)
  }
}
