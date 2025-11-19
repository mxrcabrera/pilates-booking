'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword } from '@/lib/auth'

export async function updateProfile(formData: FormData) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  const nombre = formData.get('nombre') as string
  const telefono = formData.get('telefono') as string

  await prisma.user.update({
    where: { id: userId },
    data: { nombre, telefono }
  })

  revalidatePath('/configuracion')
  return { success: true }
}

export async function changePassword(formData: FormData) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (newPassword !== confirmPassword) {
    throw new Error('Las contraseñas no coinciden')
  }

  if (newPassword.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres')
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user || !user.password) throw new Error('Usuario no encontrado')

  const isValid = await verifyPassword(currentPassword, user.password)
  if (!isValid) throw new Error('Contraseña actual incorrecta')

  const hashedPassword = await hashPassword(newPassword)

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  })

  revalidatePath('/configuracion')
  return { success: true }
}

export async function saveHorario(formData: FormData) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  const id = formData.get('id') as string | null
  const diaSemana = parseInt(formData.get('diaSemana') as string)
  const horaInicio = formData.get('horaInicio') as string
  const horaFin = formData.get('horaFin') as string
  const esManiana = formData.get('esManiana') === 'true'

  // Obtener horarios por defecto configurados
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      horarioMananaInicio: true,
      horarioMananaFin: true,
      horarioTardeInicio: true,
      horarioTardeFin: true
    }
  })

  if (!user) throw new Error('Usuario no encontrado')

  // Validar que los horarios estén dentro del rango configurado
  if (esManiana) {
    if (horaInicio < user.horarioMananaInicio || horaFin > user.horarioMananaFin) {
      throw new Error(
        `El horario de mañana debe estar entre ${user.horarioMananaInicio} y ${user.horarioMananaFin}`
      )
    }
  } else {
    if (horaInicio < user.horarioTardeInicio || horaFin > user.horarioTardeFin) {
      throw new Error(
        `El horario de tarde debe estar entre ${user.horarioTardeInicio} y ${user.horarioTardeFin}`
      )
    }
  }

  // Validar que horaInicio < horaFin
  if (horaInicio >= horaFin) {
    throw new Error('La hora de inicio debe ser anterior a la hora de fin')
  }

  if (id) {
    // Actualizar (modo edición)
    await prisma.horarioDisponible.update({
      where: { id },
      data: { diaSemana, horaInicio, horaFin, esManiana }
    })
  } else {
    // Modo crear: buscar si ya existe un horario con el mismo día + turno
    const existente = await prisma.horarioDisponible.findFirst({
      where: {
        profesorId: userId,
        diaSemana,
        esManiana
      }
    })

    if (existente) {
      // Si existe, actualizarlo (upsert)
      await prisma.horarioDisponible.update({
        where: { id: existente.id },
        data: { horaInicio, horaFin }
      })
    } else {
      // Si no existe, crear uno nuevo
      await prisma.horarioDisponible.create({
        data: {
          profesorId: userId,
          diaSemana,
          horaInicio,
          horaFin,
          esManiana
        }
      })
    }
  }

  revalidatePath('/configuracion')
  return { success: true }
}

export async function deleteHorario(id: string) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  await prisma.horarioDisponible.delete({
    where: { id }
  })

  revalidatePath('/configuracion')
  return { success: true }
}

export async function toggleHorario(id: string) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  const horario = await prisma.horarioDisponible.findUnique({
    where: { id }
  })

  if (!horario) throw new Error('Horario no encontrado')

  await prisma.horarioDisponible.update({
    where: { id },
    data: { estaActivo: !horario.estaActivo }
  })

  revalidatePath('/configuracion')
  return { success: true }
}

export async function updatePreferencias(formData: FormData) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  const horasAnticipacionMinima = parseInt(formData.get('horasAnticipacionMinima') as string)
  const maxAlumnosPorClase = parseInt(formData.get('maxAlumnosPorClase') as string)
  const horarioMananaInicio = formData.get('horarioMananaInicio') as string
  const horarioMananaFin = formData.get('horarioMananaFin') as string
  const horarioTardeInicio = formData.get('horarioTardeInicio') as string
  const horarioTardeFin = formData.get('horarioTardeFin') as string
  const espacioCompartidoId = formData.get('espacioCompartidoId') as string
  const syncGoogleCalendar = formData.get('syncGoogleCalendar') === 'on'

  // Normalizar el código de espacio (trim y lowercase)
  const espacioNormalizado = espacioCompartidoId?.trim().toLowerCase() || null

  await prisma.user.update({
    where: { id: userId },
    data: {
      horasAnticipacionMinima,
      maxAlumnosPorClase,
      horarioMananaInicio,
      horarioMananaFin,
      horarioTardeInicio,
      horarioTardeFin,
      espacioCompartidoId: espacioNormalizado,
      syncGoogleCalendar
    }
  })

  revalidatePath('/configuracion')
  revalidatePath('/calendario')
  return { success: true }
}

export async function savePack(formData: FormData) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  const id = formData.get('id') as string | null
  const nombre = formData.get('nombre') as string
  const clasesPorSemana = parseInt(formData.get('clasesPorSemana') as string)
  const precio = parseFloat(formData.get('precio') as string)
  const estaActivo = formData.get('estaActivo') === 'on'

  if (id) {
    // Editar pack existente
    await prisma.pack.update({
      where: { id },
      data: {
        nombre,
        clasesPorSemana,
        precio,
        estaActivo
      }
    })
  } else {
    // Crear nuevo pack
    await prisma.pack.create({
      data: {
        profesorId: userId,
        nombre,
        clasesPorSemana,
        precio,
        estaActivo: true
      }
    })
  }

  revalidatePath('/configuracion')
  revalidatePath('/alumnos')
  return { success: true }
}

export async function deletePack(id: string) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  const pack = await prisma.pack.findUnique({
    where: { id }
  })

  if (!pack || pack.profesorId !== userId) {
    throw new Error('Pack no encontrado')
  }

  await prisma.pack.delete({
    where: { id }
  })

  revalidatePath('/configuracion')
  revalidatePath('/alumnos')
  return { success: true }
}

export async function togglePack(id: string) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  const pack = await prisma.pack.findUnique({
    where: { id }
  })

  if (!pack) throw new Error('Pack no encontrado')

  await prisma.pack.update({
    where: { id },
    data: { estaActivo: !pack.estaActivo }
  })

  revalidatePath('/configuracion')
  revalidatePath('/alumnos')
  return { success: true }
}