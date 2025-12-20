import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const targetEmail = 'cabreramxr@gmail.com'

  console.log('=== LIMPIANDO Y CREANDO CLASES SIMPLES ===\n')

  const user = await prisma.user.findFirst({ where: { email: targetEmail } })
  if (!user) {
    console.log('Usuario no encontrado')
    return
  }

  // Borrar TODAS las clases
  await prisma.clase.deleteMany({})
  console.log('✅ Todas las clases eliminadas')

  // Obtener alumnos activos
  const alumnos = await prisma.alumno.findMany({
    where: { profesorId: user.id, estaActivo: true },
    take: 5
  })

  if (alumnos.length < 3) {
    console.log('❌ Necesitas al menos 3 alumnos activos')
    return
  }

  const hoy = new Date()
  const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 12, 0, 0)

  console.log(`\nCreando clases para HOY (${fecha.toISOString().split('T')[0]}):\n`)

  // 09:00 - 3 alumnos
  for (let i = 0; i < 3; i++) {
    await prisma.clase.create({
      data: {
        profesorId: user.id,
        alumnoId: alumnos[i].id,
        fecha,
        horaInicio: '09:00',
        estado: 'reservada'
      }
    })
  }
  console.log(`  09:00 - ${alumnos[0].nombre}, ${alumnos[1].nombre}, ${alumnos[2].nombre}`)

  // 10:00 - 2 alumnos
  for (let i = 0; i < 2; i++) {
    await prisma.clase.create({
      data: {
        profesorId: user.id,
        alumnoId: alumnos[i + 1].id,
        fecha,
        horaInicio: '10:00',
        estado: 'reservada'
      }
    })
  }
  console.log(`  10:00 - ${alumnos[1].nombre}, ${alumnos[2].nombre}`)

  // 11:00 - 2 alumnos
  for (let i = 0; i < 2; i++) {
    await prisma.clase.create({
      data: {
        profesorId: user.id,
        alumnoId: alumnos[i].id,
        fecha,
        horaInicio: '11:00',
        estado: 'reservada'
      }
    })
  }
  console.log(`  11:00 - ${alumnos[0].nombre}, ${alumnos[1].nombre}`)

  // 17:00 - 3 alumnos
  for (let i = 0; i < 3; i++) {
    await prisma.clase.create({
      data: {
        profesorId: user.id,
        alumnoId: alumnos[i].id,
        fecha,
        horaInicio: '17:00',
        estado: 'reservada'
      }
    })
  }
  console.log(`  17:00 - ${alumnos[0].nombre}, ${alumnos[1].nombre}, ${alumnos[2].nombre}`)

  // 18:00 - 2 alumnos
  for (let i = 0; i < 2; i++) {
    await prisma.clase.create({
      data: {
        profesorId: user.id,
        alumnoId: alumnos[i + 2].id,
        fecha,
        horaInicio: '18:00',
        estado: 'reservada'
      }
    })
  }
  console.log(`  18:00 - ${alumnos[2].nombre}, ${alumnos[3].nombre}`)

  // 19:00 - 3 alumnos
  for (let i = 0; i < 3; i++) {
    await prisma.clase.create({
      data: {
        profesorId: user.id,
        alumnoId: alumnos[i].id,
        fecha,
        horaInicio: '19:00',
        estado: 'reservada'
      }
    })
  }
  console.log(`  19:00 - ${alumnos[0].nombre}, ${alumnos[1].nombre}, ${alumnos[2].nombre}`)

  const total = await prisma.clase.count()
  console.log(`\n✅ TOTAL: ${total} clases creadas para hoy`)

  await prisma.$disconnect()
}

main()
