import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AlumnosClient } from './alumnos-client'

export default async function AlumnosPage() {
  const userId = await getCurrentUser()
  if (!userId) return null

  const [alumnos, packs] = await Promise.all([
    prisma.alumno.findMany({
      where: {
        profesorId: userId
      },
      include: {
        _count: {
          select: {
            clases: true,
            pagos: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    }),
    prisma.pack.findMany({
      where: {
        profesorId: userId,
        estaActivo: true
      },
      orderBy: {
        clasesPorSemana: 'asc'
      }
    })
  ])

  // Serializar datos para el cliente
  const alumnosSerializados = alumnos.map(alumno => ({
    ...alumno,
    precio: alumno.precio.toString(), // Convertir Decimal a string
    cumpleanos: alumno.cumpleanos ? alumno.cumpleanos.toISOString() : null, // Date a string
  }))

  const packsSerializados = packs.map(pack => ({
    id: pack.id,
    nombre: pack.nombre,
    clasesPorSemana: pack.clasesPorSemana,
    precio: pack.precio.toString()
  }))

  return <AlumnosClient alumnos={alumnosSerializados} packs={packsSerializados} />
}