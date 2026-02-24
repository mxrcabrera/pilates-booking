import { logger } from './logger'

const MAX_RETRIES = 2
const BASE_DELAY_MS = 500

export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  label: string
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, options)
      if (response.ok || response.status < 500) return response

      lastError = new Error(`HTTP ${response.status}`)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
    }

    if (attempt < MAX_RETRIES) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt)
      await new Promise(r => setTimeout(r, delay))
    }
  }

  logger.error(`${label}: all ${MAX_RETRIES + 1} attempts failed`, lastError)
  throw lastError!
}
