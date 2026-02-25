'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser, hashPassword, verifyPassword } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateTimeRange, validateTimeInRange } from '@/lib/validation'
import { updatePreferenciasSchema } from '@/lib/schemas/configuracion.schema'

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

  if (newPassword.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres')
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

  // Validar rango de tiempo usando función centralizada
  const timeRangeError = validateTimeRange(horaInicio, horaFin)
  if (timeRangeError) throw new Error(timeRangeError)

  // Validar que los horarios estén dentro del rango configurado
  const turnoNombre = esManiana ? 'mañana' : 'tarde'
  const horarioInicio = esManiana ? user.horarioMananaInicio : user.horarioTardeInicio
  const horarioFin = esManiana ? user.horarioMananaFin : user.horarioTardeFin

  const rangeError = validateTimeInRange(horaInicio, horarioInicio, horarioFin, turnoNombre)
  if (rangeError) throw new Error(rangeError)

  if (id) {
    const existing = await prisma.horarioDisponible.findFirst({
      where: { id, profesorId: userId, deletedAt: null }
    })
    if (!existing) throw new Error('Horario no encontrado')

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

  const horario = await prisma.horarioDisponible.findFirst({
    where: { id, profesorId: userId, deletedAt: null }
  })
  if (!horario) throw new Error('Horario no encontrado')

  await prisma.horarioDisponible.update({
    where: { id },
    data: { deletedAt: new Date() }
  })

  revalidatePath('/configuracion')
  return { success: true }
}

export async function toggleHorario(id: string) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  const horario = await prisma.horarioDisponible.findFirst({
    where: { id, profesorId: userId, deletedAt: null }
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

  const raw: Record<string, unknown> = {}

  const stringFields = [
    'horarioMananaInicio', 'horarioMananaFin',
    'horarioTardeInicio', 'horarioTardeFin'
  ] as const
  for (const field of stringFields) {
    const val = formData.get(field) as string | null
    if (val) raw[field] = val
  }

  const numberFields = [
    'horasAnticipacionMinima', 'maxAlumnosPorClase', 'precioPorClase'
  ] as const
  for (const field of numberFields) {
    const val = formData.get(field) as string | null
    if (val) raw[field] = val
  }

  const boolFields = [
    'turnoMananaActivo', 'turnoTardeActivo', 'syncGoogleCalendar'
  ] as const
  for (const field of boolFields) {
    if (formData.has(field)) {
      raw[field] = formData.get(field) === 'on'
    }
  }

  if (Object.keys(raw).length === 0) {
    throw new Error('No hay datos para actualizar')
  }

  const parsed = updatePreferenciasSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  await prisma.user.update({
    where: { id: userId },
    data: parsed.data
  })

  revalidatePath('/configuracion')
  revalidatePath('/calendario')
  revalidatePath('/alumnos')
  return { success: true }
}

export async function savePack(formData: FormData) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  const id = formData.get('id') as string | null
  const nombre = formData.get('nombre') as string
  const clasesPorSemana = parseInt(formData.get('clasesPorSemana') as string)
  const precio = parseFloat(formData.get('precio') as string)

  if (id) {
    const existing = await prisma.pack.findFirst({
      where: { id, profesorId: userId, deletedAt: null }
    })
    if (!existing) throw new Error('Pack no encontrado')

    await prisma.pack.update({
      where: { id },
      data: {
        nombre,
        clasesPorSemana,
        precio
      }
    })
  } else {
    // Crear nuevo pack
    await prisma.pack.create({
      data: {
        profesorId: userId,
        nombre,
        clasesPorSemana,
        precio
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

  const pack = await prisma.pack.findFirst({
    where: { id, profesorId: userId, deletedAt: null }
  })
  if (!pack) throw new Error('Pack no encontrado')

  await prisma.pack.update({
    where: { id },
    data: { deletedAt: new Date() }
  })

  revalidatePath('/configuracion')
  revalidatePath('/alumnos')
  return { success: true }
}