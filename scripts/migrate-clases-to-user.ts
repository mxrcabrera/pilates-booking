import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Email del usuario destino - CAMBIAR ESTE SI ES NECESARIO
  const targetEmail = process.argv[2] || 'cabreramxr@gmail.com'

  console.log(`=== MIGRANDO CLASES AL USUARIO: ${targetEmail} ===\n`)

  // Buscar usuario destino
  const targetUser = await prisma.user.findFirst({
    where: { email: targetEmail }
  })

  if (!targetUser) {
    console.log(`❌ No se encontró usuario con email: ${targetEmail}`)
    console.log('\nUsuarios disponibles:')
    const users = await prisma.user.findMany({ select: { email: true, nombre: true } })
    users.forEach(u => console.log(`  - ${u.email} (${u.nombre})`))
    return
  }

  console.log(`✅ Usuario encontrado: ${targetUser.nombre} (${targetUser.id})`)

  // Migrar clases
  const result = await prisma.clase.updateMany({
    data: { profesorId: targetUser.id }
  })
  console.log(`✅ ${result.count} clases migradas`)

  // Migrar alumnos
  const result2 = await prisma.alumno.updateMany({
    data: { profesorId: targetUser.id }
  })
  console.log(`✅ ${result2.count} alumnos migrados`)

  // Migrar packs
  const result3 = await prisma.pack.updateMany({
    data: { profesorId: targetUser.id }
  })
  console.log(`✅ ${result3.count} packs migrados`)

  // Migrar horarios
  const result4 = await prisma.horarioDisponible.updateMany({
    data: { profesorId: targetUser.id }
  })
  console.log(`✅ ${result4.count} horarios migrados`)

  console.log('\n✅ ¡MIGRACIÓN COMPLETA!')
  console.log('Ahora todas las clases están bajo el usuario:', targetEmail)

  await prisma.$disconnect()
}

main()
