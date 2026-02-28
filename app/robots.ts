import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.AUTH_URL || 'https://pilatesbooking.com'
  return {
    rules: {
      userAgent: '*',
      allow: '/login',
      disallow: ['/dashboard', '/alumnos', '/calendario', '/pagos', '/configuracion', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
