import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres.wgtyxmocjzfeumtznopn:UPTNQxLyIgAxa3Ea@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

function createPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: DATABASE_URL,
      },
    },
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
