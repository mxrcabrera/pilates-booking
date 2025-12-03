import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function backup() {
  const profesores = await prisma.$queryRaw`SELECT * FROM profesores`
  fs.writeFileSync('profesores-backup.json', JSON.stringify(profesores, null, 2))
  console.log('Backup guardado en profesores-backup.json')
  await prisma.$disconnect()
}

backup()
