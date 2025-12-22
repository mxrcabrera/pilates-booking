# Pilates Booking

Sistema de gestión para clases de pilates.

## Stack

- **Framework**: Next.js 16 (App Router)
- **Base de datos**: PostgreSQL + Prisma ORM
- **Autenticación**: NextAuth v5 (Google OAuth + Credentials)
- **Hosting**: Netlify

## Desarrollo

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Variables de entorno

Crear archivo `.env` con:

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Deploy

El proyecto está desplegado en Netlify. Los pushes a `main` disparan deploy automático.
