'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addWeeks } from 'date-fns'

export async function createClase(formData: FormData) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  const alumnaId = formData.get('alumnaId') as string
  const horaInicio = formData.get('horaInicio') as string
  const horaRecurrenteInput = formData.get('horaRecurrente') as string
  const horaRecurrente = horaRecurrenteInput || horaInicio
  const esClasePrueba = formData.get('esClasePrueba') === 'true'
  const esRecurrente = formData.get('esRecurrente') === 'true'
  const frecuenciaSemanal = esRecurrente ? parseInt(formData.get('frecuenciaSemanal') as string) : null
  
  const diasSemanaStr = formData.get('diasSemana') as string | null
  const diasSemana = diasSemanaStr ? JSON.parse(diasSemanaStr) : []

  const fechaStr = formData.get('fecha') as string
  const fecha = new Date(fechaStr + 'T12:00:00.000Z')

  const diaSemana = fecha.getUTCDay()
  
  if (diaSemana === 0 || diaSemana === 6) {
    const [hora] = horaInicio.split(':').map(Number)
    const esManiana = hora < 12
    
    const horarioDisponible = await prisma.horarioDisponible.findFirst({
      where: {
        profesoraId: userId,
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
      profesoraId: userId,
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

  await prisma.clase.create({
    data: {
      profesoraId: userId,
      alumnaId: alumnaId || null,
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
          profesoraId: userId,
          alumnaId: alumnaId || null,
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

  const id = formData.get('id') as string
  const alumnaId = formData.get('alumnaId') as string
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
  const fecha = new Date(fechaStr + 'T12:00:00.000Z')

  const diaSemana = fecha.getUTCDay()
  
  if (diaSemana === 0 || diaSemana === 6) {
    const [hora] = horaInicio.split(':').map(Number)
    const esManiana = hora < 12
    
    const horarioDisponible = await prisma.horarioDisponible.findFirst({
      where: {
        profesoraId: userId,
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
      profesoraId: userId,
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

  await prisma.clase.update({
    where: { id },
    data: {
      alumnaId: alumnaId || null,
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

  revalidatePath('/calendario')
  return { success: true }
}

export async function deleteClase(id: string) {
  const userId = await getCurrentUser()
  if (!userId) throw new Error('No autorizado')

  await prisma.clase.delete({
    where: { id }
  })

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