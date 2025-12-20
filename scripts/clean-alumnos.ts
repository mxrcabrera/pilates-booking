import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const profesorId = '831f1c88-85f3-4ce0-9208-a4bcce594a02'

  // Renombrar alumnos activos quitando '(Test)' y similares
  const updates = [
    { oldName: 'Carla Rodríguez (Pack 12 - Test)', newName: 'Carla Rodríguez' },
    { oldName: 'Ana López (Por Clase - Test)', newName: 'Ana López' },
    { oldName: 'Sofía Martínez (Mensual - Test)', newName: 'Sofía Martínez' },
    { oldName: 'Laura Pérez (Pack 4 - Excedida)', newName: 'Laura Pérez' },
    { oldName: 'Laura Pérez (Pack 4 - Test)', newName: 'Valentina Torres' },
    { oldName: 'María García (Pack 8 - Test)', newName: 'María García' },
    { oldName: 'María García (Test)', newName: 'Camila Fernández' },
    { oldName: 'Laura Pérez (Test)', newName: 'Luciana Gómez' },
    { oldName: 'Carla Rodríguez (Test)', newName: 'Martina Díaz' },
    { oldName: 'Ana López (Test)', newName: 'Julieta Romero' },
    { oldName: 'Tomás Fernández (Test)', newName: 'Paula Aguirre' },
  ]

  for (const { oldName, newName } of updates) {
    const result = await prisma.alumno.updateMany({
      where: { nombre: oldName, profesorId },
      data: { nombre: newName }
    })
    if (result.count > 0) {
      console.log('Renombrado:', oldName, '->', newName)
    }
  }

  // Desactivar los que quedaron con (Test) o Test 2 o Sofía Martínez (Test)
  const toDeactivate = await prisma.alumno.findMany({
    where: {
      profesorId,
      estaActivo: true,
      OR: [
        { nombre: { contains: '(Test)' } },
        { nombre: 'Test 2' },
      ]
    },
    select: { id: true, nombre: true }
  })

  for (const alumno of toDeactivate) {
    await prisma.alumno.update({
      where: { id: alumno.id },
      data: { estaActivo: false }
    })
    console.log('Desactivado:', alumno.nombre)
  }

  // Mostrar alumnos activos finales
  const activos = await prisma.alumno.findMany({
    where: { profesorId, estaActivo: true },
    select: { nombre: true },
    orderBy: { nombre: 'asc' }
  })
  console.log('\nAlumnos activos finales:')
  activos.forEach(a => console.log('  -', a.nombre))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
