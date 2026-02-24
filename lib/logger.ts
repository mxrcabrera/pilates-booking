const isDev = process.env.NODE_ENV === 'development'

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      ...(error.cause ? { cause: serializeError(error.cause) } : {})
    }
  }
  return { value: String(error) }
}

export const logger = {
  error: (message: string, error?: unknown) => {
    if (isDev) {
      console.error(message, error)
    } else {
      console.error(JSON.stringify({
        level: 'error',
        message,
        ...(error ? { error: serializeError(error) } : {}),
        timestamp: new Date().toISOString()
      }))
    }
  },
  warn: (message: string, data?: unknown) => {
    if (isDev) {
      console.warn(message, data)
    } else {
      console.warn(JSON.stringify({ level: 'warn', message, timestamp: new Date().toISOString() }))
    }
  },
  info: (message: string, data?: unknown) => {
    if (isDev) {
      console.log(message, data)
    }
  },
  debug: (message: string, data?: unknown) => {
    if (isDev) {
      console.debug(message, data)
    }
  }
}
