import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // El usuario correcto (el que está logueado)
  const correctUserId = '831f1c88-85f3-4ce0-9208-a4bcce594a02' // cabreramxr@gmail.com

  // Mover todos los alumnos de test al usuario correcto
  const result = await prisma.alumno.updateMany({
    where: {
      nombre: { contains: 'Test' }
    },
    data: {
      profesorId: correctUserId
    }
  })

  console.log(`✅ Actualizados ${result.count} alumnos de test`)

  // También mover las clases asociadas
  const clasesResult = await prisma.clase.updateMany({
    where: {
      alumno: {
        nombre: { contains: 'Test' }
      }
    },
    data: {
      profesorId: correctUserId
    }
  })

  console.log(`✅ Actualizadas ${clasesResult.count} clases`)

  // Verificar
  const alumnos = await prisma.alumno.findMany({
    where: { profesorId: correctUserId },
    select: { nombre: true, packType: true, clasesPorMes: true, estaActivo: true }
  })

  console.log('\nAlumnos ahora asignados a cabreramxr@gmail.com:')
  alumnos.forEach(a => {
    console.log(`- ${a.nombre} (${a.packType}, clasesPorMes: ${a.clasesPorMes}, activo: ${a.estaActivo})`)
  })
}

main()
  .finally(() => prisma.$disconnect())
