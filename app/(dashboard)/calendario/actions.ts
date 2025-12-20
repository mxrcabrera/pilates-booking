'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addWeeks } from 'date-fns'
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar'

export async function createClase(formData: FormData) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  // Obtener configuración del usuario
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      horasAnticipacionMinima: true,
      maxAlumnosPorClase: true,
      syncGoogleCalendar: true
    }
  })

  if (!user) throw new Error('Usuario no encontrado')

  const alumnoId = formData.get('alumnoId') as string
  const horaInicio = formData.get('horaInicio') as string
  const horaRecurrenteInput = formData.get('horaRecurrente') as string
  const horaRecurrente = horaRecurrenteInput || horaInicio
  const esClasePrueba = formData.get('esClasePrueba') === 'true'
  const esRecurrente = formData.get('esRecurrente') === 'true'
  const frecuenciaSemanal = esRecurrente ? parseInt(formData.get('frecuenciaSemanal') as string) : null

  const diasSemanaStr = formData.get('diasSemana') as string | null
  const diasSemana = diasSemanaStr ? JSON.parse(diasSemanaStr) : []

  const fechaStr = formData.get('fecha') as string
  const fecha = new Date(fechaStr + 'T00:00:00.000Z')

  // Validar que la clase sea al menos X horas en el futuro (según configuración)
  const [hora, minuto] = horaInicio.split(':').map(Number)

  // Construir fecha/hora de la clase en hora local Argentina
  const fechaHoraClase = new Date(fecha)
  fechaHoraClase.setHours(hora, minuto, 0, 0)

  const ahora = new Date()
  const diferenciaMs = fechaHoraClase.getTime() - ahora.getTime()
  const diferenciaHoras = diferenciaMs / (1000 * 60 * 60)

  if (diferenciaHoras < user.horasAnticipacionMinima) {
    const horasTexto = user.horasAnticipacionMinima === 1 ? '1 hora' : `${user.horasAnticipacionMinima} horas`
    throw new Error(`Las clases deben reservarse con al menos ${horasTexto} de anticipación`)
  }

  const diaSemana = fecha.getUTCDay()
  
  if (diaSemana === 0 || diaSemana === 6) {
    const [hora] = horaInicio.split(':').map(Number)
    const esManiana = hora < 12
    
    const horarioDisponible = await prisma.horarioDisponible.findFirst({
      where: {
        profesorId: userId,
        diaSemana,
        esManiana,
        estaActivo: true
      }
    })
    
    if (!horarioDisponible) {
      const nombreDia = diaSemana === 6 ? 'sábados' : 'domingos'
      const turno = esManiana ? 'mañana' : 'tarde'
      throw new Error(`No trabajás los ${nombreDia} por la ${turno}`)
    }
    
    if (horaInicio < horarioDisponible.horaInicio || horaInicio > horarioDisponible.horaFin) {
      const nombreDia = diaSemana === 6 ? 'sábado' : 'domingo'
      const turno = esManiana ? 'mañana' : 'tarde'
      throw new Error(
        `Tu horario de ${nombreDia} ${turno} es de ${horarioDisponible.horaInicio} a ${horarioDisponible.horaFin}`
      )
    }
  }
  
  const claseExistente = await prisma.clase.findFirst({
    where: {
      profesorId: userId,
      fecha,
      horaInicio,
      estado: {
        not: 'cancelada'
      }
    }
  })
  
  if (claseExistente) {
    throw new Error('Ya tenés una clase reservada en ese horario')
  }

  // Validar cantidad máxima de alumnos por clase
  const clasesEnMismoHorario = await prisma.clase.count({
    where: {
      profesorId: userId,
      fecha,
      horaInicio,
      estado: {
        not: 'cancelada'
      }
    }
  })

  if (clasesEnMismoHorario >= user.maxAlumnosPorClase) {
    throw new Error(`Esta clase ya alcanzó el máximo de ${user.maxAlumnosPorClase} alumnos`)
  }

  const claseCreada = await prisma.clase.create({
    data: {
      profesorId: userId,
      alumnoId: alumnoId || null,
      fecha,
      horaInicio,
      horaRecurrente: horaRecurrente !== horaInicio ? horaRecurrente : null,
      esClasePrueba,
      esRecurrente,
      frecuenciaSemanal,
      diasSemana,
      estado: 'reservada'
    }
  })

  // Sincronizar con Google Calendar si está activado
  if (user.syncGoogleCalendar) {
    try {
      // Obtener tokens de Google de la tabla Account
      const account = await prisma.account.findFirst({
        where: {
          userId: userId,
          provider: 'google'
        },
        select: {
          access_token: true,
          refresh_token: true
        }
      })

      if (account?.access_token) {
        const eventId = await createCalendarEvent(
          claseCreada.id,
          account.access_token,
          account.refresh_token || undefined
        )

        // Guardar el eventId en la clase
        await prisma.clase.update({
          where: { id: claseCreada.id },
          data: { googleEventId: eventId }
        })
      }
    } catch (error) {
      console.error('Error al sincronizar con Google Calendar:', error)
      // No fallar la creación de la clase si falla la sincronización
    }
  }

  // Crear clases recurrentes
  if (esRecurrente && diasSemana.length > 0) {
    const clasesACrear: any[] = []
    const diaInicialSeleccionado = fecha.getUTCDay()
    
    for (const diaSeleccionado of diasSemana) {
      let diasHastaProximoDia = diaSeleccionado - diaInicialSeleccionado
      
      if (diasHastaProximoDia <= 0) {
        diasHastaProximoDia += 7
      }
      
      const primeraOcurrencia = new Date(fecha)
      primeraOcurrencia.setUTCDate(fecha.getUTCDate() + diasHastaProximoDia)
      
      for (let i = 0; i < 8; i++) {
        const fechaClase = addWeeks(primeraOcurrencia, i)
        
        clasesACrear.push({
          profesorId: userId,
          alumnoId: alumnoId || null,
          fecha: fechaClase,
          horaInicio: horaRecurrente,
          horaRecurrente: horaRecurrente !== horaInicio ? horaRecurrente : null,
          esClasePrueba,
          esRecurrente: true,
          frecuenciaSemanal,
          diasSemana,
          estado: 'reservada'
        })
      }
    }
    
    if (clasesACrear.length > 0) {
      await prisma.clase.createMany({
        data: clasesACrear,
        skipDuplicates: true
      })
    }
  }

  revalidatePath('/calendario')
  return { success: true }
}

export async function updateClase(formData: FormData) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  // Obtener configuración del usuario
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      horasAnticipacionMinima: true,
      maxAlumnosPorClase: true,
      syncGoogleCalendar: true
    }
  })

  if (!user) throw new Error('Usuario no encontrado')

  const id = formData.get('id') as string
  const alumnoId = formData.get('alumnoId') as string
  const horaInicio = formData.get('horaInicio') as string
  const horaRecurrenteInput = formData.get('horaRecurrente') as string
  const horaRecurrente = horaRecurrenteInput || horaInicio
  const estado = formData.get('estado') as string
  const esClasePrueba = formData.get('esClasePrueba') === 'true'
  const esRecurrente = formData.get('esRecurrente') === 'true'
  const frecuenciaSemanal = esRecurrente ? parseInt(formData.get('frecuenciaSemanal') as string) : null

  const diasSemanaStr = formData.get('diasSemana') as string | null
  const diasSemana = diasSemanaStr ? JSON.parse(diasSemanaStr) : []

  const fechaStr = formData.get('fecha') as string
  const fecha = new Date(fechaStr + 'T00:00:00.000Z')

  // Validar que la clase sea al menos X horas en el futuro (según configuración)
  const [hora, minuto] = horaInicio.split(':').map(Number)

  // Construir fecha/hora de la clase en hora local Argentina
  const fechaHoraClase = new Date(fecha)
  fechaHoraClase.setHours(hora, minuto, 0, 0)

  const ahora = new Date()
  const diferenciaMs = fechaHoraClase.getTime() - ahora.getTime()
  const diferenciaHoras = diferenciaMs / (1000 * 60 * 60)

  if (diferenciaHoras < user.horasAnticipacionMinima) {
    const horasTexto = user.horasAnticipacionMinima === 1 ? '1 hora' : `${user.horasAnticipacionMinima} horas`
    throw new Error(`Las clases deben modificarse con al menos ${horasTexto} de anticipación`)
  }

  const diaSemana = fecha.getUTCDay()
  
  if (diaSemana === 0 || diaSemana === 6) {
    const [hora] = horaInicio.split(':').map(Number)
    const esManiana = hora < 12
    
    const horarioDisponible = await prisma.horarioDisponible.findFirst({
      where: {
        profesorId: userId,
        diaSemana,
        esManiana,
        estaActivo: true
      }
    })
    
    if (!horarioDisponible) {
      const nombreDia = diaSemana === 6 ? 'sábados' : 'domingos'
      const turno = esManiana ? 'mañana' : 'tarde'
      throw new Error(`No trabajás los ${nombreDia} por la ${turno}`)
    }
    
    if (horaInicio < horarioDisponible.horaInicio || horaInicio > horarioDisponible.horaFin) {
      const nombreDia = diaSemana === 6 ? 'sábado' : 'domingo'
      const turno = esManiana ? 'mañana' : 'tarde'
      throw new Error(
        `Tu horario de ${nombreDia} ${turno} es de ${horarioDisponible.horaInicio} a ${horarioDisponible.horaFin}`
      )
    }
  }
  
  const claseExistente = await prisma.clase.findFirst({
    where: {
      profesorId: userId,
      fecha,
      horaInicio,
      estado: {
        not: 'cancelada'
      },
      id: {
        not: id
      }
    }
  })
  
  if (claseExistente) {
    throw new Error('Ya tenés otra clase reservada en ese horario')
  }

  // Validar cantidad máxima de alumnos por clase
  const clasesEnMismoHorario = await prisma.clase.count({
    where: {
      profesorId: userId,
      fecha,
      horaInicio,
      estado: {
        not: 'cancelada'
      },
      id: {
        not: id // Excluir la clase actual
      }
    }
  })

  if (clasesEnMismoHorario >= user.maxAlumnosPorClase) {
    throw new Error(`Esta clase ya alcanzó el máximo de ${user.maxAlumnosPorClase} alumnos`)
  }

  // Obtener clase actual para comparar cambios
  const claseActual = await prisma.clase.findUnique({
    where: { id }
  })

  const claseActualizada = await prisma.clase.update({
    where: { id },
    data: {
      alumnoId: alumnoId || null,
      fecha,
      horaInicio,
      horaRecurrente: horaRecurrente !== horaInicio ? horaRecurrente : null,
      estado,
      esClasePrueba,
      esRecurrente,
      frecuenciaSemanal,
      diasSemana
    }
  })

  // Sincronizar con Google Calendar si está activado
  if (user.syncGoogleCalendar) {
    try {
      // Obtener tokens de Google de la tabla Account
      const account = await prisma.account.findFirst({
        where: {
          userId: userId,
          provider: 'google'
        },
        select: {
          access_token: true,
          refresh_token: true
        }
      })

      if (account?.access_token) {
        if (claseActualizada.googleEventId) {
          await updateCalendarEvent(
            claseActualizada.id,
            claseActualizada.googleEventId,
            account.access_token,
            account.refresh_token || undefined
          )
        } else {
          // Si no tiene evento pero ahora tiene sync activado, crear uno
          const eventId = await createCalendarEvent(
            claseActualizada.id,
            account.access_token,
            account.refresh_token || undefined
          )
          await prisma.clase.update({
            where: { id: claseActualizada.id },
            data: { googleEventId: eventId }
          })
        }
      }
    } catch (error) {
      console.error('Error al sincronizar con Google Calendar:', error)
    }
  }

  revalidatePath('/calendario')
  return { success: true }
}

export async function deleteClase(id: string) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  // Obtener la clase antes de borrarla para sincronizar con Google Calendar
  const clase = await prisma.clase.findUnique({
    where: { id },
    select: { googleEventId: true }
  })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { syncGoogleCalendar: true }
  })

  await prisma.clase.delete({
    where: { id }
  })

  // Eliminar de Google Calendar si está sincronizado
  if (user?.syncGoogleCalendar && clase?.googleEventId) {
    try {
      // Obtener tokens de Google de la tabla Account
      const account = await prisma.account.findFirst({
        where: {
          userId: userId,
          provider: 'google'
        },
        select: {
          access_token: true,
          refresh_token: true
        }
      })

      if (account?.access_token) {
        await deleteCalendarEvent(
          clase.googleEventId,
          account.access_token,
          account.refresh_token || undefined
        )
      }
    } catch (error) {
      console.error('Error al eliminar de Google Calendar:', error)
    }
  }

  revalidatePath('/calendario')
  return { success: true }
}

export async function changeClaseStatus(id: string, estado: string) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  await prisma.clase.update({
    where: { id },
    data: { estado }
  })

  revalidatePath('/calendario')
  return { success: true }
}