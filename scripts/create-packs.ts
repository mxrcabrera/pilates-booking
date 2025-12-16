import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
const prisma = new PrismaClient()

async function main() {
  const correctUserId = '831f1c88-85f3-4ce0-9208-a4bcce594a02'

  // Crear packs para el usuario
  const packsToCreate = [
    { nombre: 'Pack 4 clases', clasesPorSemana: 1, precio: 8000 },   // 1 clase/semana = 4/mes
    { nombre: 'Pack 8 clases', clasesPorSemana: 2, precio: 15000 },  // 2 clases/semana = 8/mes
    { nombre: 'Pack 12 clases', clasesPorSemana: 3, precio: 20000 }, // 3 clases/semana = 12/mes
  ]

  for (const pack of packsToCreate) {
    const existing = await prisma.pack.findFirst({
      where: { profesorId: correctUserId, nombre: pack.nombre }
    })

    if (!existing) {
      await prisma.pack.create({
        data: {
          profesorId: correctUserId,
          nombre: pack.nombre,
          clasesPorSemana: pack.clasesPorSemana,
          precio: new Decimal(pack.precio),
          estaActivo: true,
        }
      })
      console.log(`✅ Creado: ${pack.nombre}`)
    } else {
      console.log(`⏭️ Ya existe: ${pack.nombre}`)
    }
  }

  // Obtener todos los packs del usuario
  const packs = await prisma.pack.findMany({
    where: { profesorId: correctUserId },
    orderBy: { clasesPorSemana: 'asc' }
  })

  console.log('\nPacks disponibles:')
  packs.forEach(p => {
    const clasesPorMes = p.clasesPorSemana * 4
    console.log(`- ${p.nombre} (${p.clasesPorSemana} clases/semana = ${clasesPorMes}/mes) - $${p.precio}`)
    console.log(`  ID: ${p.id}`)
  })

  // Ahora actualizar los alumnos de test para usar los packs reales
  const pack4 = packs.find(p => p.clasesPorSemana === 1)
  const pack8 = packs.find(p => p.clasesPorSemana === 2)
  const pack12 = packs.find(p => p.clasesPorSemana === 3)

  if (pack4) {
    await prisma.alumno.updateMany({
      where: { nombre: { contains: 'Pack 4' } },
      data: { packType: pack4.id, clasesPorMes: 4 }
    })
    console.log('\n✅ Actualizado Laura con Pack 4')
  }

  if (pack8) {
    await prisma.alumno.updateMany({
      where: { nombre: { contains: 'Pack 8' } },
      data: { packType: pack8.id, clasesPorMes: 8 }
    })
    console.log('✅ Actualizado María con Pack 8')
  }

  if (pack12) {
    await prisma.alumno.updateMany({
      where: { nombre: { contains: 'Pack 12' } },
      data: { packType: pack12.id, clasesPorMes: 12 }
    })
    console.log('✅ Actualizado Carla con Pack 12')
  }

  // Mostrar alumnos actualizados
  const alumnos = await prisma.alumno.findMany({
    where: { profesorId: correctUserId },
    select: { nombre: true, packType: true, clasesPorMes: true }
  })

  console.log('\nAlumnos actualizados:')
  alumnos.forEach(a => console.log(`- ${a.nombre}: packType=${a.packType}, clasesPorMes=${a.clasesPorMes}`))
}

main().finally(() => prisma.$disconnect())
