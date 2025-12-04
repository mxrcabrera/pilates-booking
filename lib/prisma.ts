import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

// En desarrollo, reutilizar la conexión
// En producción (serverless), cada request puede crear una nueva instancia
// pero Prisma maneja el pooling internamente con PgBouncer
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
