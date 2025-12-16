import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
const prisma = new PrismaClient()

async function main() {
  const correctUserId = '831f1c88-85f3-4ce0-9208-a4bcce594a02'

  // Actualizar precios de packs a valores realistas
  // Tu pack de 2 clases/semana está a $55.000, así que:
  // - 1 clase/semana (Pack 4): ~$30.000
  // - 2 clases/semana (Pack 8): $55.000 (ya existe)
  // - 3 clases/semana (Pack 12): ~$75.000

  await prisma.pack.updateMany({
    where: { profesorId: correctUserId, nombre: 'Pack 4 clases' },
    data: { precio: new Decimal(30000) }
  })
  console.log('✅ Pack 4 clases: $30.000')

  await prisma.pack.updateMany({
    where: { profesorId: correctUserId, nombre: 'Pack 8 clases' },
    data: { precio: new Decimal(55000) }
  })
  console.log('✅ Pack 8 clases: $55.000')

  await prisma.pack.updateMany({
    where: { profesorId: correctUserId, nombre: 'Pack 12 clases' },
    data: { precio: new Decimal(75000) }
  })
  console.log('✅ Pack 12 clases: $75.000')

  // Actualizar precios de alumnas de test para que coincidan con sus packs
  // Laura (Pack 4): $30.000
  await prisma.alumno.updateMany({
    where: { nombre: { contains: 'Laura' } },
    data: { precio: new Decimal(30000) }
  })

  // María (Pack 8): $55.000
  await prisma.alumno.updateMany({
    where: { nombre: { contains: 'María García' } },
    data: { precio: new Decimal(55000) }
  })

  // Carla (Pack 12): $75.000
  await prisma.alumno.updateMany({
    where: { nombre: { contains: 'Carla' } },
    data: { precio: new Decimal(75000) }
  })

  // Ana y Sofía (por clase / mensual): precio por clase típico ~$8.000
  await prisma.alumno.updateMany({
    where: { nombre: { contains: 'Ana López' } },
    data: { precio: new Decimal(8000) }
  })

  await prisma.alumno.updateMany({
    where: { nombre: { contains: 'Sofía' } },
    data: { precio: new Decimal(50000) } // mensual sin límite
  })

  console.log('\n✅ Precios de alumnas actualizados')

  // Mostrar resultado
  const packs = await prisma.pack.findMany({
    where: { profesorId: correctUserId },
    orderBy: { clasesPorSemana: 'asc' }
  })

  console.log('\nPacks con precios actualizados:')
  packs.forEach(p => {
    console.log(`- ${p.nombre}: $${Number(p.precio).toLocaleString('es-AR')}`)
  })

  const alumnos = await prisma.alumno.findMany({
    where: { profesorId: correctUserId },
    select: { nombre: true, precio: true, packType: true }
  })

  console.log('\nAlumnas con precios:')
  alumnos.forEach(a => {
    console.log(`- ${a.nombre}: $${Number(a.precio).toLocaleString('es-AR')}`)
  })
}

main().finally(() => prisma.$disconnect())
