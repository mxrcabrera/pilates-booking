import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getMercadoPagoClient } from '@/lib/mercadopago'

export const runtime = 'nodejs'

/**
 * POST - Webhook para recibir notificaciones de Mercado Pago
 * 
 * Security notes:
 * - Mercado Pago sends notifications via POST with a signature in headers
 * - We verify the notification by fetching the payment details from Mercado Pago API
 * - This prevents fake notifications since only Mercado Pago can create valid payment IDs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, type } = body

    // Mercado Pago sends different notification types
    // We only care about 'payment' notifications
    if (type !== 'payment') {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const paymentId = data?.id
    if (!paymentId) {
      console.error('Webhook: Missing payment ID in notification')
      return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 })
    }

    // Find the pago in our database by mpPaymentId or mpPreferenceId
    const pago = await prisma.pago.findFirst({
      where: {
        OR: [
          { mpPaymentId: paymentId },
          { mpPreferenceId: paymentId },
        ],
        deletedAt: null,
      },
      include: {
        estudio: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!pago) {
      console.error(`Webhook: Pago not found for payment ID ${paymentId}`)
      return NextResponse.json({ error: 'Pago not found' }, { status: 404 })
    }

    // Get Mercado Pago client for this estudio
    if (!pago.estudioId) {
      console.error(`Webhook: Pago ${pago.id} has no estudioId`)
      return NextResponse.json({ error: 'Estudio ID missing' }, { status: 400 })
    }

    const mpClient = await getMercadoPagoClient(pago.estudioId)
    if (!mpClient) {
      console.error(`Webhook: Mercado Pago not configured for estudio ${pago.estudioId}`)
      return NextResponse.json({ error: 'Mercado Pago not configured' }, { status: 400 })
    }

    // Fetch payment details from Mercado Pago API to verify
    // This prevents fake notifications since only Mercado Pago can provide valid payment data
    const paymentData = await (mpClient.client as { payment: { get: (params: { id: string }) => Promise<{ body: { status: string; external_reference: string; date_approved?: string } }> } }).payment.get({ id: paymentId })

    if (!paymentData || !paymentData.body) {
      console.error(`Webhook: Failed to fetch payment ${paymentId} from Mercado Pago`)
      return NextResponse.json({ error: 'Failed to fetch payment data' }, { status: 500 })
    }

    const payment = paymentData.body
    const status = payment.status
    const externalReference = payment.external_reference

    // Verify that this payment belongs to our pago (via external_reference)
    if (externalReference !== pago.id) {
      console.error(`Webhook: Payment ${paymentId} external_reference ${externalReference} does not match pago ${pago.id}`)
      return NextResponse.json({ error: 'Payment does not belong to this pago' }, { status: 400 })
    }

    // Update pago based on payment status
    if (status === 'approved') {
      // Payment successful
      await prisma.pago.update({
        where: { id: pago.id },
        data: {
          estado: 'pagado',
          fechaPago: new Date(payment.date_approved || new Date()),
          mpPaymentId: paymentId,
        },
      })

      console.log(`Webhook: Pago ${pago.id} marked as pagado (MP payment ${paymentId})`)
    } else if (status === 'rejected' || status === 'cancelled') {
      // Payment failed
      await prisma.pago.update({
        where: { id: pago.id },
        data: {
          estado: 'pendiente', // Keep as pending for retry
          mpPaymentId: paymentId,
        },
      })

      console.log(`Webhook: Pago ${pago.id} payment ${status} (MP payment ${paymentId})`)
    } else if (status === 'in_process' || status === 'pending') {
      // Payment still processing
      await prisma.pago.update({
        where: { id: pago.id },
        data: {
          mpPaymentId: paymentId,
        },
      })

      console.log(`Webhook: Pago ${pago.id} payment ${status} (MP payment ${paymentId})`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    // Always return 200 to Mercado Pago to avoid retry spam
    // Log the error for manual review
    return NextResponse.json({ received: true, error: 'Internal error' }, { status: 200 })
  }
}

/**
 * GET - Health check for webhook endpoint
 */
export async function GET() {
  return NextResponse.json({ status: 'webhook operational' })
}
