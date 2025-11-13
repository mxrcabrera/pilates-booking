import { prisma } from '../lib/prisma'

async function cleanup() {
  console.log('Limpiando cuentas duplicadas...')

  // Eliminar todas las accounts de OAuth
  await prisma.account.deleteMany({})
  console.log('✓ Accounts eliminadas')

  // Eliminar todas las sessions
  await prisma.session.deleteMany({})
  console.log('✓ Sessions eliminadas')

  // Eliminar usuarios sin password (creadas por OAuth)
  const usuariosOAuth = await prisma.user.deleteMany({
    where: { password: null }
  })
  console.log(`✓ ${usuariosOAuth.count} usuarios OAuth eliminados`)

  console.log('Listo!')
}

cleanup()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
