import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-utils'
import { format } from 'date-fns'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const userId = await getCurrentUser()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar rol del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (user?.role === 'ALUMNO') {
      return NextResponse.json({ redirect: '/alumno/dashboard' })
    }

    const hoy = format(new Date(), 'yyyy-MM-dd')

    const [totalAlumnos, clasesHoy, pagosVencidos] = await Promise.all([
      prisma.alumno.count({
        where: {
          profesorId: userId,
          estaActivo: true
        }
      }),
      prisma.clase.findMany({
        where: {
          profesorId: userId,
          fecha: new Date(hoy)
        },
        include: {
          alumno: {
            select: {
              nombre: true
            }
          }
        },
        orderBy: {
          horaInicio: 'asc'
        }
      }),
      prisma.pago.count({
        where: {
          alumno: {
            profesorId: userId
          },
          estado: 'vencido'
        }
      })
    ])

    return NextResponse.json({
      totalAlumnos,
      clasesHoy,
      pagosVencidos
    })
  } catch (error: any) {
    console.error('Dashboard GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
