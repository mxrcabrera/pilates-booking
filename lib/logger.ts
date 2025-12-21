const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  error: (message: string, error?: unknown) => {
    if (isDev) {
      console.error(message, error)
    } else {
      // En producción, solo el mensaje, no detalles sensibles
      console.error(message)
      // TODO: Integrar con servicio de logging (Sentry, LogRocket, etc.)
    }
  },
  warn: (message: string, data?: unknown) => {
    if (isDev) {
      console.warn(message, data)
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
