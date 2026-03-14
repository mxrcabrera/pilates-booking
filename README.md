# Pilates Booking

Class management platform for Pilates instructors and studios. Handles scheduling, student management, payments, attendance tracking, and online booking — with support for multi-instructor studios.

## What It Does

- **Class scheduling** with recurring classes, time slot configuration (morning/afternoon shifts), and calendar view
- **Student management** — CRUD, pack assignments, active/paused status, waitlist
- **Payment tracking** — monthly invoicing, overdue alerts, payment history
- **Attendance marking** — per-class present/absent tracking
- **Online booking** — students browse available slots and self-book classes
- **Multi-tenancy** — studios with team roles (Owner, Admin, Instructor, Viewer)
- **Subscription plans** — feature-gated tiers (Free, Starter, Pro, Studio)
- **Google Calendar sync** — automatic class sync for Pro+ plans
- **Analytics & reports** — class stats, revenue, attendance rates

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Frontend | React 19, Tailwind CSS 4 |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma 6 |
| Auth | NextAuth v5 (Google OAuth + Credentials/JWT) |
| Validation | Zod |
| Email | Resend |
| Icons | Lucide React |
| Charts | Recharts |
| Testing | Jest + Playwright |
| Hosting | Netlify |

## Getting Started

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start dev server (localhost:3000)
npm run dev
```

### Environment Variables

Create a `.env` file (see `.env.example`):

```bash
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
AUTH_SECRET=your-secret-key
AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
JWT_SECRET=...
RESEND_API_KEY=...
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests (Jest) |
| `npm run test:e2e` | Run E2E tests (Playwright) |

## Architecture

```
app/
├── (auth)/              # Login page
├── (dashboard)/         # Protected instructor routes
│   ├── alumnos/         # Student management
│   ├── calendario/      # Class scheduling & calendar
│   ├── configuracion/   # Preferences, time slots, packs
│   ├── dashboard/       # Overview with stats
│   ├── equipo/          # Studio team management
│   ├── pagos/           # Payment tracking
│   ├── planes/          # Subscription plans
│   └── reportes/        # Analytics
├── alumno/              # Student portal
│   ├── reservar/        # Browse & book classes
│   └── mis-clases/      # View bookings
├── api/v1/              # RESTful API endpoints
├── onboarding/          # Role selection flow
│
lib/
├── auth/                # NextAuth config, JWT utils, permissions
├── schemas/             # Zod validation schemas
├── services/            # Email, Google Calendar, notifications
├── server-cache.ts      # Server-side caching
└── prisma.ts            # Database client singleton
```

### Key Patterns

- **Owner filtering** — queries filter by `estudioId` (studio) or `profesorId` (solo instructor) via `ownerFilter`
- **Server-side caching** — `getCachedPacks()`, `getCachedHorarios()`, `getCachedAlumnosSimple()` with estudio/profesor support
- **Zod schemas** — centralized validation in `lib/schemas/` for all API inputs
- **API helpers** — `unauthorized()`, `badRequest()`, `notFound()` from `lib/api-utils.ts`
- **Role-based access** — middleware + permissions system for studio team roles

### Database Models

Core entities: **User**, **Alumno**, **Clase**, **Pago**, **Pack**, **HorarioDisponible**, **Estudio**, **EstudioMiembro**, **Notificacion**, **ListaEspera**, **FechaBloqueada**

Full schema in `prisma/schema.prisma`.

## License

MIT
