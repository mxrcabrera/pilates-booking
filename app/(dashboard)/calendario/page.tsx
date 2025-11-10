import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CalendarioClient } from './calendario-client'

export default async function CalendarioPage() {
  const userId = await getCurrentUser()
  if (!userId) return null

  const hoy = new Date()
  
  // Cargar 3 meses (mes anterior, actual, siguiente)
  const inicioRango = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
  const finRango = new Date(hoy.getFullYear(), hoy.getMonth() + 2, 0)

  const clases = await prisma.clase.findMany({
    where: {
      profesoraId: userId,
      fecha: {
        gte: inicioRango,
        lte: finRango
      }
    },
    include: {
      alumna: {
        select: {
          id: true,
          nombre: true
        }
      }
    },
    orderBy: {
      horaInicio: 'asc'
    }
  })

  const clasesNormalizadas = clases.map(clase => ({
    ...clase,
    fecha: new Date(clase.fecha.getTime() + clase.fecha.getTimezoneOffset() * 60000)
  }))

  const alumnas = await prisma.alumna.findMany({
    where: {
      profesoraId: userId,
      estaActiva: true
    },
    select: {
      id: true,
      nombre: true
    },
    orderBy: {
      nombre: 'asc'
    }
  })

  return <CalendarioClient clases={clasesNormalizadas} alumnas={alumnas} />
}