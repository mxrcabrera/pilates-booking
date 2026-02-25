import { Resend } from 'resend'
import { logger } from '../logger'
import { formatCurrency } from '../format'
import type { NotificationType } from '@prisma/client'

// Only instantiate Resend if the API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const FROM_EMAIL = process.env.EMAIL_FROM || 'Pilates Studio <noreply@pilates.app>'

interface EmailParams {
  to: string
  subject: string
  html: string
}

async function sendEmail({ to, subject, html }: EmailParams): Promise<boolean> {
  if (!resend) {
    logger.warn('RESEND_API_KEY not configured, skipping email')
    return false
  }

  const MAX_RETRIES = 2
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      })

      if (error) {
        logger.error('Error sending email', { error, to, attempt })
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)))
          continue
        }
        return false
      }

      logger.info('Email sent', { to, subject })
      return true
    } catch (error) {
      logger.error('Error sending email', { error, to, attempt })
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)))
        continue
      }
      return false
    }
  }
  return false
}

interface NotificationEmailData {
  alumnoNombre: string
  profesorNombre: string
  fecha: string
  hora: string
  tipo: NotificationType
}

export async function sendNotificationEmail(
  to: string,
  data: NotificationEmailData
): Promise<boolean> {
  const { alumnoNombre, profesorNombre, fecha, hora, tipo } = data

  let subject: string
  let content: string

  switch (tipo) {
    case 'CLASE_NUEVA':
      subject = `Nueva clase reservada - ${fecha}`
      content = `
        <h2>Nueva Clase Reservada</h2>
        <p>Hola ${alumnoNombre},</p>
        <p>Tu clase ha sido reservada con éxito.</p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Fecha:</strong> ${fecha}</p>
          <p><strong>Hora:</strong> ${hora}</p>
          <p><strong>Profesor:</strong> ${profesorNombre}</p>
        </div>
        <p>¡Te esperamos!</p>
      `
      break

    case 'CLASE_MODIFICADA':
      subject = `Clase modificada - ${fecha}`
      content = `
        <h2>Clase Modificada</h2>
        <p>Hola ${alumnoNombre},</p>
        <p>Tu clase ha sido modificada.</p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Nueva Fecha:</strong> ${fecha}</p>
          <p><strong>Nueva Hora:</strong> ${hora}</p>
          <p><strong>Profesor:</strong> ${profesorNombre}</p>
        </div>
      `
      break

    case 'CLASE_CANCELADA':
      subject = `Clase cancelada - ${fecha}`
      content = `
        <h2>Clase Cancelada</h2>
        <p>Hola ${alumnoNombre},</p>
        <p>Lamentamos informarte que tu clase ha sido cancelada.</p>
        <div style="background: #fff3cd; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Fecha:</strong> ${fecha}</p>
          <p><strong>Hora:</strong> ${hora}</p>
          <p><strong>Profesor:</strong> ${profesorNombre}</p>
        </div>
        <p>Por favor, contactá a tu profesor para reprogramar.</p>
      `
      break

    case 'RECORDATORIO_CLASE':
      subject = `Recordatorio: Clase mañana a las ${hora}`
      content = `
        <h2>Recordatorio de Clase</h2>
        <p>Hola ${alumnoNombre},</p>
        <p>Te recordamos que tenés una clase programada para mañana.</p>
        <div style="background: #d4edda; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Fecha:</strong> ${fecha}</p>
          <p><strong>Hora:</strong> ${hora}</p>
          <p><strong>Profesor:</strong> ${profesorNombre}</p>
        </div>
        <p>¡Te esperamos!</p>
      `
      break

    case 'LUGAR_DISPONIBLE':
      subject = `¡Hay lugar disponible! - ${fecha}`
      content = `
        <h2>¡Lugar Disponible!</h2>
        <p>Hola ${alumnoNombre},</p>
        <p>¡Buenas noticias! Se liberó un lugar en la clase que estabas esperando.</p>
        <div style="background: #cfe2ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Fecha:</strong> ${fecha}</p>
          <p><strong>Hora:</strong> ${hora}</p>
          <p><strong>Profesor:</strong> ${profesorNombre}</p>
        </div>
        <p><strong>Tenés un tiempo limitado para confirmar tu lugar.</strong></p>
        <p>Ingresá a la app para confirmar tu reserva.</p>
      `
      break

    default:
      return false
  }

  const html = getEmailTemplate(content)
  return sendEmail({ to, subject, html })
}

function getEmailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    h2 {
      color: #6366f1;
      margin-bottom: 16px;
    }
    p {
      margin: 8px 0;
    }
  </style>
</head>
<body>
  ${content}
  <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
  <p style="color: #666; font-size: 12px;">
    Este email fue enviado automáticamente. Por favor no respondas a este mensaje.
  </p>
</body>
</html>
`
}

export async function sendWelcomeEmail(
  to: string,
  nombre: string,
  profesorNombre: string
): Promise<boolean> {
  const subject = `¡Bienvenido/a a las clases de ${profesorNombre}!`
  const content = `
    <h2>¡Bienvenido/a!</h2>
    <p>Hola ${nombre},</p>
    <p>¡Qué alegría tenerte como alumno/a!</p>
    <p>Ahora podés:</p>
    <ul>
      <li>Ver tus próximas clases</li>
      <li>Reservar nuevas clases</li>
      <li>Cancelar reservas si es necesario</li>
    </ul>
    <p>Si tenés alguna consulta, no dudes en contactar a ${profesorNombre}.</p>
    <p>¡Te esperamos!</p>
  `
  const html = getEmailTemplate(content)
  return sendEmail({ to, subject, html })
}

export async function sendPaymentReminderEmail(
  to: string,
  alumnoNombre: string,
  monto: string,
  fechaVencimiento: string
): Promise<boolean> {
  const subject = `Recordatorio de pago - Vencimiento: ${fechaVencimiento}`
  const content = `
    <h2>Recordatorio de Pago</h2>
    <p>Hola ${alumnoNombre},</p>
    <p>Te recordamos que tenés un pago pendiente.</p>
    <div style="background: #fff3cd; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p><strong>Monto:</strong> ${formatCurrency(monto)}</p>
      <p><strong>Vencimiento:</strong> ${fechaVencimiento}</p>
    </div>
    <p>Por favor, realizá el pago antes de la fecha de vencimiento para evitar interrupciones en tus clases.</p>
  `
  const html = getEmailTemplate(content)
  return sendEmail({ to, subject, html })
}
