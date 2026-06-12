import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserContext, getOwnerFilter } from '@/lib/auth'
import { getMercadoPagoClient } from '@/lib/mercadopago'
import { unauthorized, badRequest, serverError } from '@/lib/api-utils'
import { z } from 'zod'

export const runtime = 'nodejs'

// Schema para validar creación de preferencia
const createPreferenceSchema = z.object({
  estudioId: z.string().min(1, 'Estudio ID es requerido'),
  alumnoId: z.string().min(1, 'Alumno ID es requerido'),
  monto: z.number().positive('El monto debe ser positivo'),
  descripcion: z.string().min(1, 'Descripción es requerida'),
  pagoId: z.string().optional(), // Si existe, vincular a pago existente
  mesCorrespondiente: z.string().optional(),
  tipoPago: z.string().default('mensual'),
  clasesEsperadas: z.number().optional(),
})

/**
 * POST - Crear preferencia de pago en Mercado Pago
 */
export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext()
    if (!context) {
      return unauthorized()
    }

    const { userId, estudio } = context
    const body = await request.json()
    const parsed = createPreferenceSchema.safeParse(body)

    if (!parsed.success) {
      return badRequest(parsed.error.issues[0].message)
    }

    const {
      estudioId,
      alumnoId,
      monto,
      descripcion,
      pagoId,
      mesCorrespondiente,
      tipoPago,
      clasesEsperadas,
    } = parsed.data

    // Verificar que el usuario tiene acceso al estudio
    if (estudio && estudio.estudioId !== estudioId) {
      return badRequest('No tienes acceso a este estudio')
    }

    // Si no está en contexto de estudio, verificar que el usuario es el profesor
    if (!estudio) {
      const userEstudio = await prisma.estudioMiembro.findFirst({
        where: {
          userId,
          estudioId,
          deletedAt: null,
        },
      })
      if (!userEstudio) {
        return badRequest('No tienes acceso a este estudio')
      }
    }

    // Obtener cliente de Mercado Pago para el estudio
    const mpClient = await getMercadoPagoClient(estudioId)
    if (!mpClient) {
      return badRequest('Mercado Pago no está configurado para este estudio')
    }

    // Verificar que el alumno existe y pertenece al estudio
    const ownerFilter = getOwnerFilter(context)
    const alumno = await prisma.alumno.findFirst({
      where: { id: alumnoId, ...ownerFilter, deletedAt: null },
    })

    if (!alumno) {
      return badRequest('Alumno no encontrado o no tienes acceso')
    }

    // Crear o vincular pago en nuestra DB
    let pago
    if (pagoId) {
      // Vincular a pago existente
      pago = await prisma.pago.findFirst({
        where: { id: pagoId, ...ownerFilter, deletedAt: null },
      })

      if (!pago) {
        return badRequest('Pago no encontrado')
      }

      // Actualizar con datos de Mercado Pago cuando se cree la preferencia
    } else {
      // Crear nuevo registro de pago pendiente
      pago = await prisma.pago.create({
        data: {
          alumnoId,
          profesorId: userId,
          estudioId,
          monto,
          fechaVencimiento: new Date(),
          estado: 'pendiente',
          mesCorrespondiente: mesCorrespondiente || new Date().toISOString().slice(0, 7),
          tipoPago: tipoPago || 'mensual',
          clasesEsperadas,
        },
      })
    }

    // Crear preferencia en Mercado Pago
    const preferenceData = {
      items: [
        {
          id: pago.id,
          title: descripcion,
          quantity: 1,
          currency_id: 'ARS',
          unit_price: monto,
        },
      ],
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/pagos/success?payment_id=${pago.id}`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/pagos/failure?payment_id=${pago.id}`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/pagos/pending?payment_id=${pago.id}`,
      },
      auto_return: 'approved',
      external_reference: pago.id, // Usar nuestro ID de pago como referencia
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/pagos/webhook`,
    }

    const preference = await (mpClient.client as { preference: { create: (data: unknown) => Promise<{ id: string; init_point: string }> } }).preference.create(preferenceData)

    if (!preference || !preference.id) {
      return serverError(new Error('Error al crear preferencia en Mercado Pago'))
    }

    // Actualizar nuestro registro de pago con el ID de preferencia de Mercado Pago
    await prisma.pago.update({
      where: { id: pago.id },
      data: { mpPreferenceId: preference.id },
    })

    return NextResponse.json({
      success: true,
      init_point: preference.init_point,
      preferenceId: preference.id,
      pagoId: pago.id,
    })
  } catch (error) {
    console.error('Error creating Mercado Pago preference:', error)
    return serverError(error)
  }
}
