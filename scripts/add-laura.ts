import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
const prisma = new PrismaClient()

async function main() {
  const correctUserId = '831f1c88-85f3-4ce0-9208-a4bcce594a02'

  // Verificar si ya existe Laura
  const existing = await prisma.alumno.findFirst({
    where: { nombre: { contains: 'Laura' } }
  })

  if (existing) {
    // Moverla al usuario correcto
    await prisma.alumno.update({
      where: { id: existing.id },
      data: { profesorId: correctUserId }
    })
    console.log('Laura ya existía, movida al usuario correcto')
  } else {
    // Crear Laura
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const laura = await prisma.alumno.create({
      data: {
        profesorId: correctUserId,
        nombre: 'Laura Pérez (Pack 4 - Excedida)',
        email: 'laura.test@example.com',
        telefono: '1155552222',
        genero: 'F',
        packType: 'pack_4',
        clasesPorMes: 4,
        precio: new Decimal(8000),
        estaActivo: true,
      }
    })

    // Crear 4 clases (todas usadas)
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
  }

  // Mostrar alumnos finales
  const alumnos = await prisma.alumno.findMany({
    where: { profesorId: correctUserId },
    select: { nombre: true, packType: true, clasesPorMes: true, estaActivo: true }
  })

  console.log('\nAlumnos:')
  alumnos.forEach(a => {
    console.log(`- ${a.nombre} (${a.packType}, limit: ${a.clasesPorMes})`)
  })
}

main().finally(() => prisma.$disconnect())
