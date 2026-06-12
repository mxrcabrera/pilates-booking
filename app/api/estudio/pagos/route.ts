import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserContext, hasPermission } from '@/lib/auth'
import { unauthorized, badRequest, forbidden, serverError } from '@/lib/api-utils'
import { z } from 'zod'

export const runtime = 'nodejs'

// Schema para validar credenciales de Mercado Pago
const mpCredentialsSchema = z.object({
  mpAccessToken: z.string().min(1, 'Access Token es requerido'),
  mpPublicKey: z.string().min(1, 'Public Key es requerida'),
})

/**
 * GET - Obtener estado de configuración de Mercado Pago
 * Solo devuelve si está configurado o no, nunca las credenciales reales
 */
export async function GET(_request: NextRequest) {
  try {
    const context = await getUserContext()
    if (!context) {
      return unauthorized()
    }

    const { userId: _userId, estudio } = context

    // Solo usuarios con rol OWNER pueden ver la configuración
    if (!estudio) {
      return badRequest('Esta API es solo para estudios multi-tenant')
    }

    if (!hasPermission(estudio.rol, 'edit:configuracion')) {
      return forbidden('Solo el OWNER puede ver la configuración de pagos')
    }

    const estudioData = await prisma.estudio.findUnique({
      where: { id: estudio.estudioId },
      select: {
        mpAccessToken: true,
        mpPublicKey: true,
      },
    })

    if (!estudioData) {
      return badRequest('Estudio no encontrado')
    }

    // Nunca exponer las credenciales reales al frontend
    // Solo indicar si están configuradas
    return NextResponse.json({
      configured: !!(estudioData.mpAccessToken && estudioData.mpPublicKey),
      // Para debug: mostrar solo los primeros 4 caracteres del access token
      // accessTokenPreview: estudioData.mpAccessToken ? `${estudioData.mpAccessToken.substring(0, 4)}...` : null,
    })
  } catch (error) {
    return serverError(error)
  }
}

/**
 * POST - Guardar o actualizar credenciales de Mercado Pago
 * Solo rol OWNER
 */
export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext()
    if (!context) {
      return unauthorized()
    }

    const { userId: _userId, estudio } = context

    // Solo usuarios con rol OWNER pueden modificar la configuración
    if (!estudio) {
      return badRequest('Esta API es solo para estudios multi-tenant')
    }

    if (!hasPermission(estudio.rol, 'edit:configuracion')) {
      return forbidden('Solo el OWNER puede modificar la configuración de pagos')
    }

    const body = await request.json()
    const parsed = mpCredentialsSchema.safeParse(body)

    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message)
    }

    const { mpAccessToken, mpPublicKey } = parsed.data

    // Validar que el estudio existe
    const estudioExistente = await prisma.estudio.findUnique({
      where: { id: estudio.estudioId },
    })

    if (!estudioExistente) {
      return badRequest('Estudio no encontrado')
    }

    // Actualizar credenciales en el estudio
    await prisma.estudio.update({
      where: { id: estudio.estudioId },
      data: {
        mpAccessToken,
        mpPublicKey,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Credenciales de Mercado Pago guardadas correctamente',
    })
  } catch (error) {
    return serverError(error)
  }
}

/**
 * DELETE - Eliminar credenciales de Mercado Pago
 * Solo rol OWNER
 */
export async function DELETE(_request: NextRequest) {
  try {
    const context = await getUserContext()
    if (!context) {
      return unauthorized()
    }

    const { userId: _userId, estudio } = context

    // Solo usuarios con rol OWNER pueden eliminar la configuración
    if (!estudio) {
      return badRequest('Esta API es solo para estudios multi-tenant')
    }

    if (!hasPermission(estudio.rol, 'edit:configuracion')) {
      return forbidden('Solo el OWNER puede eliminar la configuración de pagos')
    }

    // Validar que el estudio existe
    const estudioExistente = await prisma.estudio.findUnique({
      where: { id: estudio.estudioId },
    })

    if (!estudioExistente) {
      return badRequest('Estudio no encontrado')
    }

    // Eliminar credenciales (setear a null)
    await prisma.estudio.update({
      where: { id: estudio.estudioId },
      data: {
        mpAccessToken: null,
        mpPublicKey: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Credenciales de Mercado Pago eliminadas correctamente',
    })
  } catch (error) {
    return serverError(error)
  }
}
