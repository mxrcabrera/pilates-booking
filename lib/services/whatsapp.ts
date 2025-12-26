import { logger } from '../logger'
import type { NotificationType } from '@prisma/client'

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0'

interface WhatsAppTemplateParams {
  to: string
  templateName: string
  languageCode?: string
  components?: Array<{
    type: 'body' | 'header'
    parameters: Array<{
      type: 'text'
      text: string
    }>
  }>
}

async function sendWhatsAppTemplate({
  to,
  templateName,
  languageCode = 'es_AR',
  components = [],
}: WhatsAppTemplateParams): Promise<boolean> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

  if (!phoneNumberId || !accessToken) {
    logger.warn('WhatsApp not configured, skipping message')
    return false
  }

  // Formatear número de teléfono (remover espacios, guiones, etc.)
  const formattedPhone = to.replace(/\D/g, '')

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: languageCode },
            components,
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      logger.error('Error sending WhatsApp message', { error, to: formattedPhone })
      return false
    }

    logger.info('WhatsApp message sent', { to: formattedPhone, template: templateName })
    return true
  } catch (error) {
    logger.error('Error sending WhatsApp message', error)
    return false
  }
}

interface NotificationData {
  alumnoNombre: string
  profesorNombre: string
  fecha: string
  hora: string
  tipo: NotificationType
}

export async function sendWhatsAppNotification(
  telefono: string,
  data: NotificationData
): Promise<boolean> {
  const { alumnoNombre, profesorNombre, fecha, hora, tipo } = data

  let templateName: string
  let components: WhatsAppTemplateParams['components'] = []

  switch (tipo) {
    case 'CLASE_NUEVA':
      templateName = 'clase_nueva'
      components = [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: alumnoNombre },
            { type: 'text', text: fecha },
            { type: 'text', text: hora },
            { type: 'text', text: profesorNombre },
          ],
        },
      ]
      break

    case 'CLASE_MODIFICADA':
      templateName = 'clase_modificada'
      components = [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: alumnoNombre },
            { type: 'text', text: fecha },
            { type: 'text', text: hora },
          ],
        },
      ]
      break

    case 'CLASE_CANCELADA':
      templateName = 'clase_cancelada'
      components = [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: alumnoNombre },
            { type: 'text', text: fecha },
            { type: 'text', text: hora },
          ],
        },
      ]
      break

    case 'RECORDATORIO_CLASE':
      templateName = 'recordatorio_clase'
      components = [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: alumnoNombre },
            { type: 'text', text: hora },
          ],
        },
      ]
      break

    case 'LUGAR_DISPONIBLE':
      templateName = 'lugar_disponible'
      components = [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: alumnoNombre },
            { type: 'text', text: fecha },
            { type: 'text', text: hora },
          ],
        },
      ]
      break

    default:
      return false
  }

  return sendWhatsAppTemplate({ to: telefono, templateName, components })
}

export async function sendWhatsAppWelcome(
  telefono: string,
  alumnoNombre: string,
  profesorNombre: string
): Promise<boolean> {
  return sendWhatsAppTemplate({
    to: telefono,
    templateName: 'bienvenida',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: alumnoNombre },
          { type: 'text', text: profesorNombre },
        ],
      },
    ],
  })
}

export async function sendWhatsAppPaymentReminder(
  telefono: string,
  alumnoNombre: string,
  monto: string,
  fechaVencimiento: string
): Promise<boolean> {
  return sendWhatsAppTemplate({
    to: telefono,
    templateName: 'recordatorio_pago',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: alumnoNombre },
          { type: 'text', text: monto },
          { type: 'text', text: fechaVencimiento },
        ],
      },
    ],
  })
}
