import { prisma } from '@/lib/prisma'
import mercadopago from 'mercadopago'

/**
 * Mercado Pago client factory for multi-tenant architecture
 * Fetches credentials dynamically from the database per estudio
 */

export interface MercadoPagoCredentials {
  accessToken: string
  publicKey: string
}

export interface MercadoPagoClient {
  credentials: MercadoPagoCredentials
  client: unknown // Mercado Pago SDK client
}

/**
 * Get Mercado Pago client for a specific estudio
 * @param estudioId - The estudio ID to fetch credentials for
 * @returns MercadoPagoClient or null if credentials not configured
 * @throws Error if estudio not found
 */
export async function getMercadoPagoClient(estudioId: string): Promise<MercadoPagoClient | null> {
  const estudio = await prisma.estudio.findUnique({
    where: { id: estudioId },
    select: {
      mpAccessToken: true,
      mpPublicKey: true,
    },
  })

  if (!estudio) {
    throw new Error(`Estudio with ID ${estudioId} not found`)
  }

  // Check if credentials are configured
  if (!estudio.mpAccessToken || !estudio.mpPublicKey) {
    return null
  }

  const credentials: MercadoPagoCredentials = {
    accessToken: estudio.mpAccessToken,
    publicKey: estudio.mpPublicKey,
  }

  // Initialize Mercado Pago SDK with dynamic credentials
  const client = new (mercadopago as unknown as { SDK: new (config: { accessToken: string }) => unknown }).SDK({ accessToken: credentials.accessToken })

  return {
    credentials,
    client,
  }
}

/**
 * Check if an estudio has Mercado Pago configured
 * @param estudioId - The estudio ID to check
 * @returns true if credentials are configured, false otherwise
 */
export async function isMercadoPagoConfigured(estudioId: string): Promise<boolean> {
  const estudio = await prisma.estudio.findUnique({
    where: { id: estudioId },
    select: {
      mpAccessToken: true,
      mpPublicKey: true,
    },
  })

  if (!estudio) {
    return false
  }

  return !!(estudio.mpAccessToken && estudio.mpPublicKey)
}
