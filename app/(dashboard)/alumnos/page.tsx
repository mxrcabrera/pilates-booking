import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AlumnasClient } from './alumnas-client'

export default async function AlumnosPage() {
  const userId = await getCurrentUser()
  if (!userId) return null

  const alumnas = await prisma.alumna.findMany({
    where: {
      profesoraId: userId
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
  })

  // Serializar datos para el cliente
  const alumnasSerializadas = alumnas.map(alumna => ({
    ...alumna,
    precio: alumna.precio.toString(), // Convertir Decimal a string
    cumpleanos: alumna.cumpleanos ? alumna.cumpleanos.toISOString() : null, // Date a string
  }))

  return <AlumnasClient alumnas={alumnasSerializadas} />
}