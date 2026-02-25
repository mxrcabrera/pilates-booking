import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/login',
      disallow: ['/dashboard', '/alumnos', '/calendario', '/pagos', '/configuracion', '/api/'],
    },
  }
}
