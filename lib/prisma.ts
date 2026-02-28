import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

// In development, reuse the connection
// In production (serverless), each request may create a new instance
// but Prisma handles pooling internally with PgBouncer
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
