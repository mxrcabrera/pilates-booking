import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
const prisma = new PrismaClient()

async function main() {
  const correctUserId = '831f1c88-85f3-4ce0-9208-a4bcce594a02'

  // Eliminar todas las Laura duplicadas
  const lauras = await prisma.alumno.findMany({
    where: { nombre: { contains: 'Laura' } },
    orderBy: { createdAt: 'asc' }
  })

  console.log('Lauras encontradas:', lauras.length)

  // Eliminar todas las Laura
  if (lauras.length > 0) {
    for (const laura of lauras) {
      await prisma.clase.deleteMany({ where: { alumnoId: laura.id } })
    }
    await prisma.alumno.deleteMany({
      where: { nombre: { contains: 'Laura' } }
    })
    console.log('Eliminadas todas las Laura')
  }

  // Crear una sola Laura
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const laura = await prisma.alumno.create({
    data: {
      profesorId: correctUserId,
      nombre: 'Laura Pérez (Pack 4 - Test)',
      email: 'laura.test@example.com',
      telefono: '1155552222',
      genero: 'F',
      packType: 'pack_4',
      clasesPorMes: 4,
      precio: new Decimal(8000),
      estaActivo: true,
    }
  })

  // Crear 4 clases (para que esté excedida)
  for (let i = 0; i < 4; i++) {
    const fecha = new Date(thisMonth)
    fecha.setDate(fecha.getDate() + i * 3 + 2)

    await prisma.clase.create({
      data: {
        profesorId: correctUserId,
        alumnoId: laura.id,
        fecha: fecha,
        horaInicio: '11:00',
        estado: 'completada',
      }
    })
  }

  console.log('✅ Creada Laura con 4 clases')

  // Mostrar todos los alumnos finales
  const alumnos = await prisma.alumno.findMany({
    where: { profesorId: correctUserId },
    select: { nombre: true, packType: true, clasesPorMes: true, estaActivo: true }
  })

  console.log('\nAlumnos finales:')
  alumnos.forEach(a => console.log(`- ${a.nombre} (${a.packType}, limit: ${a.clasesPorMes})`))
}

main().finally(() => prisma.$disconnect())
