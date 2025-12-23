import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@tuapp.com'
const APP_NAME = 'Pilates Booking'

export type EmailTemplate =
  | 'reserva-confirmada'
  | 'reserva-cancelada'
  | 'recordatorio-clase'
  | 'pago-vencido'
  | 'bienvenida'
  | 'lista-espera-lugar'

interface BaseEmailData {
  to: string
  alumnoNombre: string
}

interface ReservaEmailData extends BaseEmailData {
  template: 'reserva-confirmada' | 'reserva-cancelada'
  fecha: string
  hora: string
  profesorNombre: string
}

interface RecordatorioEmailData extends BaseEmailData {
  template: 'recordatorio-clase'
  fecha: string
  hora: string
  profesorNombre: string
}

interface PagoEmailData extends BaseEmailData {
  template: 'pago-vencido'
  monto: number
  fechaVencimiento: string
}

interface BienvenidaEmailData extends BaseEmailData {
  template: 'bienvenida'
  profesorNombre: string
}

interface ListaEsperaEmailData extends BaseEmailData {
  template: 'lista-espera-lugar'
  fecha: string
  hora: string
  profesorNombre: string
}

type EmailData = ReservaEmailData | RecordatorioEmailData | PagoEmailData | BienvenidaEmailData | ListaEsperaEmailData

function formatPrecio(num: number): string {
  return `$${num.toLocaleString('es-AR')}`
}

function getSubject(data: EmailData): string {
  switch (data.template) {
    case 'reserva-confirmada':
      return `Reserva confirmada - ${data.fecha} ${data.hora}`
    case 'reserva-cancelada':
      return `Reserva cancelada - ${data.fecha} ${data.hora}`
    case 'recordatorio-clase':
      return `Recordatorio: Clase mañana a las ${data.hora}`
    case 'pago-vencido':
      return `Pago pendiente - ${formatPrecio(data.monto)}`
    case 'bienvenida':
      return `Bienvenido/a a ${APP_NAME}`
    case 'lista-espera-lugar':
      return `Se liberó un lugar - ${data.fecha} ${data.hora}`
  }
}

function getHtml(data: EmailData): string {
  const baseStyles = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #6E7DF5; }
    .content { padding: 30px 0; }
    .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #666; border-top: 1px solid #eee; }
    .button { display: inline-block; padding: 12px 24px; background: #6E7DF5; color: white; text-decoration: none; border-radius: 8px; }
    .highlight { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
  `

  switch (data.template) {
    case 'reserva-confirmada':
      return `
        <html><head><style>${baseStyles}</style></head><body>
          <div class="container">
            <div class="header"><h1>${APP_NAME}</h1></div>
            <div class="content">
              <h2>¡Reserva confirmada!</h2>
              <p>Hola ${data.alumnoNombre},</p>
              <p>Tu reserva ha sido confirmada:</p>
              <div class="highlight">
                <strong>Fecha:</strong> ${data.fecha}<br>
                <strong>Hora:</strong> ${data.hora}<br>
                <strong>Profesor:</strong> ${data.profesorNombre}
              </div>
              <p>Te esperamos!</p>
            </div>
            <div class="footer">Este email fue enviado por ${APP_NAME}</div>
          </div>
        </body></html>
      `

    case 'reserva-cancelada':
      return `
        <html><head><style>${baseStyles}</style></head><body>
          <div class="container">
            <div class="header"><h1>${APP_NAME}</h1></div>
            <div class="content">
              <h2>Reserva cancelada</h2>
              <p>Hola ${data.alumnoNombre},</p>
              <p>Tu reserva ha sido cancelada:</p>
              <div class="highlight">
                <strong>Fecha:</strong> ${data.fecha}<br>
                <strong>Hora:</strong> ${data.hora}<br>
                <strong>Profesor:</strong> ${data.profesorNombre}
              </div>
              <p>Si fue un error, podés volver a reservar desde la app.</p>
            </div>
            <div class="footer">Este email fue enviado por ${APP_NAME}</div>
          </div>
        </body></html>
      `

    case 'recordatorio-clase':
      return `
        <html><head><style>${baseStyles}</style></head><body>
          <div class="container">
            <div class="header"><h1>${APP_NAME}</h1></div>
            <div class="content">
              <h2>Recordatorio de clase</h2>
              <p>Hola ${data.alumnoNombre},</p>
              <p>Te recordamos que tenés clase mañana:</p>
              <div class="highlight">
                <strong>Fecha:</strong> ${data.fecha}<br>
                <strong>Hora:</strong> ${data.hora}<br>
                <strong>Profesor:</strong> ${data.profesorNombre}
              </div>
              <p>¡Te esperamos!</p>
            </div>
            <div class="footer">Este email fue enviado por ${APP_NAME}</div>
          </div>
        </body></html>
      `

    case 'pago-vencido':
      return `
        <html><head><style>${baseStyles}</style></head><body>
          <div class="container">
            <div class="header"><h1>${APP_NAME}</h1></div>
            <div class="content">
              <h2>Pago pendiente</h2>
              <p>Hola ${data.alumnoNombre},</p>
              <p>Te recordamos que tenés un pago pendiente:</p>
              <div class="highlight">
                <strong>Monto:</strong> ${formatPrecio(data.monto)}<br>
                <strong>Vencimiento:</strong> ${data.fechaVencimiento}
              </div>
              <p>Por favor regularizá tu situación para continuar disfrutando de tus clases.</p>
            </div>
            <div class="footer">Este email fue enviado por ${APP_NAME}</div>
          </div>
        </body></html>
      `

    case 'bienvenida':
      return `
        <html><head><style>${baseStyles}</style></head><body>
          <div class="container">
            <div class="header"><h1>${APP_NAME}</h1></div>
            <div class="content">
              <h2>¡Bienvenido/a!</h2>
              <p>Hola ${data.alumnoNombre},</p>
              <p>¡Gracias por unirte a las clases de ${data.profesorNombre}!</p>
              <p>Ya podés empezar a reservar tus clases desde el portal.</p>
            </div>
            <div class="footer">Este email fue enviado por ${APP_NAME}</div>
          </div>
        </body></html>
      `

    case 'lista-espera-lugar':
      return `
        <html><head><style>${baseStyles}</style></head><body>
          <div class="container">
            <div class="header"><h1>${APP_NAME}</h1></div>
            <div class="content">
              <h2>¡Se liberó un lugar!</h2>
              <p>Hola ${data.alumnoNombre},</p>
              <p>Buenas noticias! Se liberó un lugar en la clase que estabas esperando:</p>
              <div class="highlight">
                <strong>Fecha:</strong> ${data.fecha}<br>
                <strong>Hora:</strong> ${data.hora}<br>
                <strong>Profesor:</strong> ${data.profesorNombre}
              </div>
              <p>Tu lugar ya está reservado automáticamente. ¡Te esperamos!</p>
            </div>
            <div class="footer">Este email fue enviado por ${APP_NAME}</div>
          </div>
        </body></html>
      `
  }
}

export async function sendEmail(data: EmailData): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] RESEND_API_KEY not configured, skipping email')
    return { success: true }
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: getSubject(data),
      html: getHtml(data)
    })

    if (error) {
      console.error('[Email] Error sending email:', error)
      return { success: false, error: error.message }
    }

    console.log(`[Email] Sent ${data.template} to ${data.to}`)
    return { success: true }
  } catch (err) {
    console.error('[Email] Exception:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
