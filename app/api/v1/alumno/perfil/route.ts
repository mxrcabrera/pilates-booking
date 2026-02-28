import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { updateAlumnoPerfilSchema } from '@/lib/schemas/alumno-perfil.schema'
import { unauthorized, badRequest, forbidden, tooManyRequests, serverError } from '@/lib/api-utils'

const WRITE_LIMIT = 10
const WINDOW_MS = 60 * 1000

export async function GET() {
  try {
    const userId = await getCurrentUser()

    if (!userId) {
      return unauthorized()
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        genero: true,
        role: true
      }
    })

    if (!user || user.role !== 'ALUMNO') {
      return forbidden('Acceso denegado')
    }

    return NextResponse.json({
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono,
        genero: user.genero,
        cumpleanos: null,
        patologias: null
      }
    })
  } catch (error) {
    return serverError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    const { success } = rateLimit(`alumno-perfil:${ip}`, WRITE_LIMIT, WINDOW_MS)
    if (!success) {
      return tooManyRequests()
    }

    const userId = await getCurrentUser()

    if (!userId) {
      return unauthorized()
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    })

    if (!user || user.role !== 'ALUMNO') {
      return forbidden('Acceso denegado')
    }

    const body = await request.json()
    const parsed = updateAlumnoPerfilSchema.safeParse(body)

    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message)
    }

    const { nombre, telefono, genero } = parsed.data

    await prisma.user.update({
      where: { id: userId },
      data: {
        nombre,
        telefono,
        genero
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return serverError(error)
  }
}
