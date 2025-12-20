import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== VERIFICANDO PROFESORES Y CLASES ===')

  // Ver todos los usuarios
  const usuarios = await prisma.user.findMany({
    select: { id: true, email: true, nombre: true }
  })
  console.log('\nUsuarios en el sistema:')
  usuarios.forEach(u => {
    console.log(`  ${u.id} - ${u.email} - ${u.nombre}`)
  })

  // Ver clases de hoy con profesor
  const hoy = new Date()
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0)
  const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59)

  const clasesHoy = await prisma.clase.findMany({
    where: {
      fecha: { gte: inicioHoy, lte: finHoy }
    },
    select: {
      id: true,
      horaInicio: true,
      profesorId: true,
      alumno: { select: { nombre: true } }
    }
  })

  console.log('\nClases de hoy:')
  const profesoreIds = new Set<string>()
  clasesHoy.forEach(c => {
    console.log(`  ${c.horaInicio} - ${c.alumno?.nombre || 'Sin alumno'} - Profesor: ${c.profesorId}`)
    profesoreIds.add(c.profesorId)
  })

  console.log('\nProfesores únicos en clases de hoy:')
  profesoreIds.forEach(id => {
    const user = usuarios.find(u => u.id === id)
    console.log(`  ${id} - ${user?.email || 'NO ENCONTRADO'}`)
  })

  await prisma.$disconnect()
}

main()
