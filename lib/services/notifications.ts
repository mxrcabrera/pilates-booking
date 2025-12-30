import { prisma } from '../prisma'
import { logger } from '../logger'
import { sendNotificationEmail } from './email'
// import { sendWhatsAppNotification } from './whatsapp' // Desactivado - usar links wa.me
import { canUseFeature } from '../plans'
import type { NotificationType, PlanType } from '@prisma/client'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface CreateNotificationParams {
  userId: string
  tipo: NotificationType
  titulo: string
  mensaje: string
  claseId?: string
}

export async function createNotification({
  userId,
  tipo,
  titulo,
  mensaje,
  claseId,
}: CreateNotificationParams): Promise<void> {
  try {
    await prisma.notificacion.create({
      data: {
        userId,
        tipo,
        titulo,
        mensaje,
        claseId,
      },
    })
    logger.info('Notification created', { userId, tipo })
  } catch (error) {
    logger.error('Error creating notification', error)
  }
}

interface NotifyClassEventParams {
  claseId: string
  tipo: NotificationType
  profesorId: string
  plan: PlanType
  trialEndsAt: Date | null
}

export async function notifyClassEvent({
  claseId,
  tipo,
  profesorId,
  plan,
  trialEndsAt,
}: NotifyClassEventParams): Promise<void> {
  try {
    const clase = await prisma.clase.findUnique({
      where: { id: claseId },
      include: {
        alumno: { select: { id: true, nombre: true, email: true, telefono: true, userId: true } },
        profesor: { select: { nombre: true } },
      },
    })

    if (!clase || !clase.alumno) return

    const fechaFormateada = format(clase.fecha, "EEEE d 'de' MMMM", { locale: es })

    let titulo: string
    let mensaje: string

    switch (tipo) {
      case 'CLASE_NUEVA':
        titulo = 'Nueva clase reservada'
        mensaje = `Tenés una clase el ${fechaFormateada} a las ${clase.horaInicio}`
        break
      case 'CLASE_MODIFICADA':
        titulo = 'Clase modificada'
        mensaje = `Tu clase fue modificada al ${fechaFormateada} a las ${clase.horaInicio}`
        break
      case 'CLASE_CANCELADA':
        titulo = 'Clase cancelada'
        mensaje = `Tu clase del ${fechaFormateada} fue cancelada`
        break
      case 'RECORDATORIO_CLASE':
        titulo = 'Recordatorio de clase'
        mensaje = `Recordá que mañana tenés clase a las ${clase.horaInicio}`
        break
      default:
        return
    }

    // Crear notificación in-app si el alumno tiene cuenta
    if (clase.alumno.userId) {
      await createNotification({
        userId: clase.alumno.userId,
        tipo,
        titulo,
        mensaje,
        claseId,
      })
    }

    const notificationData = {
      alumnoNombre: clase.alumno.nombre,
      profesorNombre: clase.profesor.nombre,
      fecha: fechaFormateada,
      hora: clase.horaInicio,
      tipo,
    }

    // Enviar email si el plan lo permite
    if (canUseFeature('notificacionesEmail', plan, trialEndsAt)) {
      const emailSent = await sendNotificationEmail(clase.alumno.email, notificationData)

      // Marcar como enviado si el alumno tiene cuenta
      if (emailSent && clase.alumno.userId) {
        await prisma.notificacion.updateMany({
          where: {
            userId: clase.alumno.userId,
            claseId,
            tipo,
            emailEnviado: false,
          },
          data: { emailEnviado: true },
        })
      }
    }

    // WhatsApp automático desactivado - usar links manuales wa.me en su lugar
    // TODO: Reactivar cuando se configure WhatsApp Business API
    // if (canUseFeature('notificacionesWhatsApp', plan, trialEndsAt) && clase.alumno.telefono) {
    //   sendWhatsAppNotification(clase.alumno.telefono, notificationData).catch(() => {})
    // }
  } catch (error) {
    logger.error('Error notifying class event', error)
  }
}

export async function notifyWaitlistAvailable(
  listaEsperaId: string,
  profesorId: string,
  plan: PlanType,
  trialEndsAt: Date | null
): Promise<void> {
  try {
    const entrada = await prisma.listaEspera.findUnique({
      where: { id: listaEsperaId },
      include: {
        alumno: { select: { id: true, nombre: true, email: true, telefono: true, userId: true } },
        profesor: { select: { nombre: true } },
      },
    })

    if (!entrada || !entrada.alumno) return

    const fechaFormateada = format(entrada.fecha, "EEEE d 'de' MMMM", { locale: es })
    const titulo = '¡Lugar disponible!'
    const mensaje = `Se liberó un lugar para la clase del ${fechaFormateada} a las ${entrada.horaInicio}`

    // Crear notificación in-app
    if (entrada.alumno.userId) {
      await createNotification({
        userId: entrada.alumno.userId,
        tipo: 'LUGAR_DISPONIBLE',
        titulo,
        mensaje,
      })
    }

    const notificationData = {
      alumnoNombre: entrada.alumno.nombre,
      profesorNombre: entrada.profesor.nombre,
      fecha: fechaFormateada,
      hora: entrada.horaInicio,
      tipo: 'LUGAR_DISPONIBLE' as const,
    }

    // Enviar email si el plan lo permite
    if (canUseFeature('notificacionesEmail', plan, trialEndsAt)) {
      await sendNotificationEmail(entrada.alumno.email, notificationData)
    }

    // WhatsApp automático desactivado - usar links manuales wa.me en su lugar
    // TODO: Reactivar cuando se configure WhatsApp Business API
    // if (canUseFeature('notificacionesWhatsApp', plan, trialEndsAt) && entrada.alumno.telefono) {
    //   sendWhatsAppNotification(entrada.alumno.telefono, notificationData).catch(() => {})
    // }

    // Actualizar estado de lista de espera
    await prisma.listaEspera.update({
      where: { id: listaEsperaId },
      data: {
        estado: 'notificado',
        notificadoEn: new Date(),
        expiraEn: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 horas para confirmar
      },
    })
  } catch (error) {
    logger.error('Error notifying waitlist available', error)
  }
}
