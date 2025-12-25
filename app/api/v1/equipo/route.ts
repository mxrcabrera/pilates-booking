import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserContext, hasPermission } from '@/lib/auth/auth-utils'
import { getErrorMessage } from '@/lib/utils'
import { logger } from '@/lib/logger'
import { invitarMiembroSchema, cambiarRolSchema } from '@/lib/schemas/equipo.schema'
import { badRequest } from '@/lib/api-utils'

export const runtime = 'nodejs'

// GET: Listar miembros del equipo
export async function GET() {
  try {
    const context = await getUserContext()
    if (!context) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!context.estudio) {
      return NextResponse.json({ error: 'No perteneces a ningún estudio' }, { status: 403 })
    }

    const miembros = await prisma.estudioMiembro.findMany({
      where: { estudioId: context.estudio.estudioId, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: [
        { rol: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    return NextResponse.json({
      miembros: miembros.map(m => ({
        id: m.id,
        usuarioId: m.userId,
        nombre: m.user.nombre,
        email: m.user.email,
        image: m.user.image,
        rol: m.rol,
        createdAt: m.createdAt
      })),
      estudio: {
        id: context.estudio.estudioId,
        nombre: context.estudio.estudioNombre,
        slug: context.estudio.estudioSlug
      },
      miRol: context.estudio.rol
    })
  } catch (error) {
    logger.error('Equipo GET error', error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}

// POST: Invitar nuevo miembro
export async function POST(request: Request) {
  try {
    const context = await getUserContext()
    if (!context) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!context.estudio) {
      return NextResponse.json({ error: 'No perteneces a ningún estudio' }, { status: 403 })
    }

    // Solo OWNER y ADMIN pueden invitar
    if (!hasPermission(context.estudio.rol, 'manage:equipo')) {
      return NextResponse.json({ error: 'No tienes permiso para gestionar el equipo' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = invitarMiembroSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message)
    }
    const { email, rol } = parsed.data

    // Solo OWNER puede crear otros ADMIN
    if (rol === 'ADMIN' && context.estudio.rol !== 'OWNER') {
      return NextResponse.json({ error: 'Solo el dueño puede crear administradores' }, { status: 403 })
    }

    // Buscar usuario por email (ya normalizado por Zod)
    const usuario = await prisma.user.findUnique({
      where: { email }
    })

    if (!usuario) {
      return NextResponse.json({
        error: 'Usuario no encontrado. El usuario debe registrarse primero.'
      }, { status: 404 })
    }

    // Verificar si ya es miembro (incluyendo soft-deleted para re-activar)
    const miembroExistente = await prisma.estudioMiembro.findUnique({
      where: {
        estudioId_userId: {
          estudioId: context.estudio.estudioId,
          userId: usuario.id
        }
      }
    })

    if (miembroExistente && !miembroExistente.deletedAt) {
      return NextResponse.json({ error: 'Este usuario ya es miembro del equipo' }, { status: 400 })
    }

    // Si el miembro fue removido anteriormente, reactivarlo; si no, crear nuevo
    const nuevoMiembro = miembroExistente
      ? await prisma.estudioMiembro.update({
          where: { id: miembroExistente.id },
          data: { rol, deletedAt: null },
          include: {
            user: {
              select: {
                id: true,
                nombre: true,
                email: true,
                image: true
              }
            }
          }
        })
      : await prisma.estudioMiembro.create({
          data: {
            estudioId: context.estudio.estudioId,
            userId: usuario.id,
            rol
          },
          include: {
            user: {
              select: {
                id: true,
                nombre: true,
                email: true,
                image: true
              }
            }
          }
        })

    logger.info(`Nuevo miembro agregado al estudio ${context.estudio.estudioNombre}`, {
      email,
      rol,
      invitadoPor: context.userId
    })

    return NextResponse.json({
      success: true,
      miembro: {
        id: nuevoMiembro.id,
        usuarioId: nuevoMiembro.userId,
        nombre: nuevoMiembro.user.nombre,
        email: nuevoMiembro.user.email,
        image: nuevoMiembro.user.image,
        rol: nuevoMiembro.rol,
        createdAt: nuevoMiembro.createdAt
      }
    })
  } catch (error) {
    logger.error('Equipo POST error', error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}

// PUT: Cambiar rol de miembro
export async function PUT(request: Request) {
  try {
    const context = await getUserContext()
    if (!context) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!context.estudio) {
      return NextResponse.json({ error: 'No perteneces a ningún estudio' }, { status: 403 })
    }

    if (!hasPermission(context.estudio.rol, 'manage:equipo')) {
      return NextResponse.json({ error: 'No tienes permiso para gestionar el equipo' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = cambiarRolSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message)
    }
    const { miembroId, nuevoRol } = parsed.data

    // Obtener miembro actual
    const miembro = await prisma.estudioMiembro.findUnique({
      where: { id: miembroId }
    })

    if (!miembro || miembro.estudioId !== context.estudio.estudioId || miembro.deletedAt) {
      return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 })
    }

    // No se puede cambiar el rol del OWNER
    if (miembro.rol === 'OWNER') {
      return NextResponse.json({ error: 'No se puede cambiar el rol del dueño' }, { status: 403 })
    }

    // Solo OWNER puede asignar/quitar rol ADMIN
    if ((nuevoRol === 'ADMIN' || miembro.rol === 'ADMIN') && context.estudio.rol !== 'OWNER') {
      return NextResponse.json({ error: 'Solo el dueño puede gestionar administradores' }, { status: 403 })
    }

    const actualizado = await prisma.estudioMiembro.update({
      where: { id: miembroId },
      data: { rol: nuevoRol },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      }
    })

    logger.info(`Rol cambiado en estudio ${context.estudio.estudioNombre}`, {
      miembro: actualizado.user.email,
      rolAnterior: miembro.rol,
      nuevoRol,
      cambiadoPor: context.userId
    })

    return NextResponse.json({ success: true, miembro: actualizado })
  } catch (error) {
    logger.error('Equipo PUT error', error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}

// DELETE: Remover miembro
export async function DELETE(request: Request) {
  try {
    const context = await getUserContext()
    if (!context) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!context.estudio) {
      return NextResponse.json({ error: 'No perteneces a ningún estudio' }, { status: 403 })
    }

    if (!hasPermission(context.estudio.rol, 'manage:equipo')) {
      return NextResponse.json({ error: 'No tienes permiso para gestionar el equipo' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const miembroId = searchParams.get('id')

    if (!miembroId) {
      return NextResponse.json({ error: 'ID de miembro es requerido' }, { status: 400 })
    }

    // Obtener miembro
    const miembro = await prisma.estudioMiembro.findUnique({
      where: { id: miembroId },
      include: {
        user: {
          select: { email: true }
        }
      }
    })

    if (!miembro || miembro.estudioId !== context.estudio.estudioId || miembro.deletedAt) {
      return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 })
    }

    // No se puede remover al OWNER
    if (miembro.rol === 'OWNER') {
      return NextResponse.json({ error: 'No se puede remover al dueño del estudio' }, { status: 403 })
    }

    // Solo OWNER puede remover ADMIN
    if (miembro.rol === 'ADMIN' && context.estudio.rol !== 'OWNER') {
      return NextResponse.json({ error: 'Solo el dueño puede remover administradores' }, { status: 403 })
    }

    await prisma.estudioMiembro.update({
      where: { id: miembroId },
      data: { deletedAt: new Date() }
    })

    logger.info(`Miembro removido del estudio ${context.estudio.estudioNombre}`, {
      miembro: miembro.user.email,
      removidoPor: context.userId
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Equipo DELETE error', error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}
