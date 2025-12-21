# Pilates Booking - Documentacion Tecnica Completa

Este documento contiene toda la informacion necesaria para que cualquier IA entienda completamente el sistema: logica de negocio, arquitectura, base de datos, APIs, componentes y flujos.

---

## 1. DESCRIPCION GENERAL

**Pilates Booking** es una aplicacion web para profesores de Pilates que gestionan clases particulares o semi-particulares. Permite administrar alumnos, programar clases, controlar pagos y configurar horarios de trabajo.

**Usuarios objetivo:** Profesores independientes que trabajan desde su estudio o espacio.

---

## 2. STACK TECNOLOGICO

| Tecnologia | Version | Uso |
|-----------|---------|-----|
| Next.js | 16.0.10 | Framework full-stack (App Router + Turbopack) |
| React | 19.2.0 | UI Library |
| PostgreSQL | Supabase | Base de datos (PgBouncer pooling) |
| Prisma | 6.19.0 | ORM |
| NextAuth | 5.0.0-beta.30 | Autenticacion (Google OAuth + Credentials) |
| Radix UI | varios | Componentes base (Dialog, Select, Checkbox, etc.) |
| Tailwind CSS | 4 | Utilidades CSS |
| Lucide React | 0.548.0 | Iconos |
| date-fns | 3.x | Manejo de fechas |
| jose | 6.1.0 | JWT tokens |
| bcrypt | 6.0.0 | Hash de passwords |
| googleapis | 166.0.0 | Google Calendar API |
| zod | 4.1.12 | Validacion de schemas |
| react-day-picker | 9.11.1 | Selector de fechas |

**Hosting:** Netlify
**Timezone:** America/Argentina/Buenos_Aires (hardcodeado, no depende del sistema)

---

## 3. ESTRUCTURA DE ARCHIVOS COMPLETA

```
pilates-booking/
├── app/                           # Next.js 15 App Router
│   ├── (auth)/                    # Rutas publicas de autenticacion
│   │   ├── layout.tsx
│   │   └── login/
│   │       ├── page.tsx
│   │       └── actions.ts
│   ├── (dashboard)/               # Rutas protegidas (grupo)
│   │   ├── layout.tsx             # DashboardLayout con cache de usuario
│   │   ├── loading.tsx
│   │   ├── alumnos/
│   │   │   ├── page.tsx
│   │   │   ├── alumnos-client.tsx
│   │   │   ├── alumno-card.tsx
│   │   │   ├── alumno-detail-sheet.tsx
│   │   │   ├── alumno-dialog.tsx
│   │   │   ├── actions.ts
│   │   │   └── loading.tsx
│   │   ├── calendario/
│   │   │   ├── page.tsx
│   │   │   ├── calendario-client.tsx
│   │   │   ├── clase-dialog.tsx
│   │   │   ├── clase-detail-dialog.tsx
│   │   │   ├── actions.ts
│   │   │   └── loading.tsx
│   │   ├── configuracion/
│   │   │   ├── page.tsx
│   │   │   ├── configuracion-client.tsx
│   │   │   ├── horarios-section.tsx
│   │   │   ├── horarios-disponibles.tsx
│   │   │   ├── horario-dialog.tsx
│   │   │   ├── packs-section.tsx
│   │   │   ├── pack-dialog.tsx
│   │   │   ├── preferencias-section.tsx
│   │   │   ├── profile-form.tsx
│   │   │   ├── password-form.tsx
│   │   │   ├── confirm-dialog.tsx
│   │   │   ├── actions.ts
│   │   │   └── loading.tsx
│   │   ├── pagos/
│   │   │   ├── page.tsx
│   │   │   ├── pagos-client.tsx
│   │   │   └── pago-dialog.tsx
│   │   ├── perfil/
│   │   │   ├── page.tsx
│   │   │   └── perfil-client.tsx
│   │   └── dashboard/
│   │       ├── page.tsx
│   │       ├── dashboard-client.tsx
│   │       └── dashboard-nav.tsx
│   ├── api/
│   │   ├── alumnos/route.ts
│   │   ├── clases/route.ts
│   │   ├── pagos/route.ts
│   │   ├── dashboard/route.ts
│   │   ├── configuracion/route.ts
│   │   └── auth/
│   │       ├── [...nextauth]/route.ts
│   │       ├── me/route.ts
│   │       └── login/route.ts
│   ├── onboarding/
│   │   ├── page.tsx
│   │   ├── onboarding-client.tsx
│   │   └── actions.ts
│   ├── privacy/
│   ├── terms/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── providers.tsx
├── lib/
│   ├── auth/
│   │   ├── auth.ts
│   │   ├── auth.config.ts
│   │   ├── auth-utils.ts
│   │   └── index.ts
│   ├── prisma.ts
│   ├── types.ts
│   ├── validation.ts
│   ├── constants.ts
│   ├── utils.ts
│   ├── alumno-utils.ts
│   ├── google-calendar.ts
│   ├── api.ts
│   ├── client-cache.ts
│   ├── use-page-data.ts
│   ├── preferences-guard.ts
│   ├── actions/
│   │   └── common.ts
│   └── dates/
│       └── index.ts
├── components/
│   ├── setup-wizard.tsx
│   ├── preferences-required.tsx
│   ├── time-input.tsx
│   ├── date-input.tsx
│   ├── select-input.tsx
│   ├── accordion.tsx
│   └── ui/
│       ├── button.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── dialog.tsx
│       ├── dialog-base.tsx
│       ├── confirm-modal.tsx
│       ├── badge.tsx
│       ├── avatar.tsx
│       ├── toast.tsx
│       ├── empty-state.tsx
│       ├── loading.tsx
│       ├── form-field.tsx
│       └── section-wrapper.tsx
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── .env.local
├── package.json
├── next.config.ts
├── tsconfig.json
└── .claude/
    └── CLAUDE.md
```

---

## 4. USUARIOS Y ROLES

### Profesor (rol principal)
- Es el usuario dueno de la app
- Gestiona SUS alumnos, SUS clases, SUS pagos
- Configura SUS horarios de trabajo y preferencias
- Cada profesor tiene su propio "universo" de datos aislado (multi-tenancy por `profesorId`)

### Alumno (futuro, no implementado completamente)
- Portal para que alumnos vean sus clases y reserven (en desarrollo)
- Por ahora los alumnos son solo registros dentro del sistema del profesor

---

## 5. SCHEMA DE BASE DE DATOS COMPLETO

### Model: User (Profesor)

```prisma
model User {
  id                      String    @id @default(uuid())
  email                   String    @unique
  nombre                  String
  telefono                String?
  genero                  String    @default("F")
  password                String?                        // Para login con credentials
  emailVerified           DateTime?
  image                   String?                        // Avatar
  role                    UserRole  @default(PROFESOR)
  horasAnticipacionMinima Int       @default(1)          // Horas minimas para reservar
  maxAlumnosPorClase      Int       @default(4)
  horarioMananaInicio     String    @default("08:00")
  horarioMananaFin        String    @default("14:00")
  turnoMananaActivo       Boolean   @default(true)
  horarioTardeInicio      String    @default("17:00")
  horarioTardeFin         String    @default("22:00")
  turnoTardeActivo        Boolean   @default(true)
  espacioCompartidoId     String?                        // ID para compartir espacio
  syncGoogleCalendar      Boolean   @default(false)
  googleCalendarId        String?
  precioPorClase          Decimal   @default(0) @db.Decimal(10, 2)
  createdAt               DateTime  @default(now())

  // Relaciones
  accounts                Account[]
  sessions                Session[]
  alumnos                 Alumno[]
  clases                  Clase[]
  horariosDisponibles     HorarioDisponible[]
  packs                   Pack[]
  notificacionesRecibidas Notificacion[]
  reservasComoAlumno      Reserva[] @relation("AlumnoReservas")
  reservasComoProfesor    Reserva[] @relation("ProfesorReservas")
}

enum UserRole {
  PROFESOR
  ALUMNO
}
```

### Model: Pack

```prisma
model Pack {
  id              String   @id @default(uuid())
  profesorId      String   @map("profesor_id")
  nombre          String                              // Ej: "Pack 4 Clases", "1x por semana"
  clasesPorSemana Int      @map("clases_por_semana")  // Frecuencia del pack
  precio          Decimal  @db.Decimal(10, 2)         // Precio mensual
  createdAt       DateTime @default(now()) @map("created_at")

  profesor        User     @relation(fields: [profesorId], references: [id], onDelete: Cascade)

  @@map("packs")
}
```

### Model: Alumno

```prisma
model Alumno {
  id                 String    @id @default(uuid())
  profesorId         String    @map("profesor_id")
  nombre             String
  email              String
  telefono           String
  cumpleanos         DateTime? @db.Date
  patologias         String?                              // Descripcion de limitaciones
  packType           String    @map("pack_type")          // ID del pack o "por_clase"
  clasesPorMes       Int?      @map("clases_por_mes")     // Calculado del pack
  precio             Decimal   @db.Decimal(10, 2)
  estaActivo         Boolean   @default(true) @map("esta_activa")
  estaPausada        Boolean   @default(false) @map("esta_pausada")
  syncGoogleCalendar Boolean   @default(false) @map("sync_google_calendar")
  googleCalendarId   String?   @map("google_calendar_id")
  createdAt          DateTime  @default(now()) @map("created_at")
  genero             String    @default("F")
  consentimientoTutor Boolean  @default(false) @map("consentimiento_tutor")
  diaInicioCiclo     Int       @default(1) @map("dia_inicio_ciclo")    // Dia del mes (1-28)
  saldoAFavor        Decimal   @default(0) @db.Decimal(10, 2) @map("saldo_a_favor")

  profesor           User      @relation(fields: [profesorId], references: [id], onDelete: Cascade)
  clases             Clase[]
  pagos              Pago[]

  @@map("alumnos")
}
```

### Model: HorarioDisponible

```prisma
model HorarioDisponible {
  id         String   @id @default(uuid())
  profesorId String   @map("profesor_id")
  diaSemana  Int      @map("dia_semana")      // 0=domingo, 6=sabado
  horaInicio String   @map("hora_inicio")     // HH:MM
  horaFin    String   @map("hora_fin")        // HH:MM
  esManiana  Boolean  @map("es_maniana")      // true=manana, false=tarde
  estaActivo Boolean  @default(true) @map("esta_activo")
  createdAt  DateTime @default(now()) @map("created_at")

  profesor   User     @relation(fields: [profesorId], references: [id], onDelete: Cascade)

  @@map("horarios_disponibles")
}
```

**Proposito:** Solo para SABADOS y DOMINGOS. Lunes-Viernes usan horarios generales del User.

### Model: Clase

```prisma
model Clase {
  id                String    @id @default(uuid())
  profesorId        String    @map("profesor_id")
  alumnoId          String?   @map("alumno_id")           // Null = clase disponible
  fecha             DateTime  @db.Date
  horaInicio        String    @map("hora_inicio")         // HH:MM
  horaRecurrente    String?   @map("hora_recurrente")     // Hora diferente para recurrencias
  esRecurrente      Boolean   @default(false) @map("es_recurrente")
  frecuenciaSemanal Int?      @map("frecuencia_semanal")  // Cada cuantas semanas
  diasSemana        Int[]     @map("dias_semana")         // Array de dias (0-6)
  estado            String    @default("reservada")       // reservada, completada, cancelada
  asistencia        String    @default("pendiente")       // pendiente, presente, ausente
  esClasePrueba     Boolean   @default(false) @map("es_clase_prueba")
  googleEventId     String?   @map("google_event_id")
  createdAt         DateTime  @default(now()) @map("created_at")

  alumno            Alumno?   @relation(fields: [alumnoId], references: [id], onDelete: SetNull)
  profesor          User      @relation(fields: [profesorId], references: [id], onDelete: Cascade)

  @@map("clases")
}
```

### Model: Pago

```prisma
model Pago {
  id                 String    @id @default(uuid())
  alumnoId           String    @map("alumno_id")
  monto              Decimal   @db.Decimal(10, 2)
  fechaPago          DateTime? @db.Date @map("fecha_pago")        // Null si pendiente
  fechaVencimiento   DateTime  @db.Date @map("fecha_vencimiento")
  estado             String    @default("pendiente")              // pendiente, pagado
  mesCorrespondiente String    @map("mes_correspondiente")        // "2025-01" o "Enero 2025"
  tipoPago           String    @default("mensual") @map("tipo_pago")  // mensual, clase
  clasesEsperadas    Int?      @map("clases_esperadas")           // Para pagos mensuales
  createdAt          DateTime  @default(now()) @map("created_at")

  alumno             Alumno    @relation(fields: [alumnoId], references: [id], onDelete: Cascade)

  @@map("pagos")
}
```

### Model: Account (NextAuth - OAuth)

```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String  @map("user_id")
  type              String
  provider          String                          // "google", "credentials"
  providerAccountId String  @map("provider_account_id")
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}
```

### Model: Session (NextAuth)

```prisma
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id")
  expires      DateTime

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}
```

### Model: Reserva (Sistema futuro)

```prisma
model Reserva {
  id            String    @id @default(uuid())
  alumnoUserId  String    @map("alumno_user_id")
  profesorId    String    @map("profesor_id")
  fecha         DateTime  @db.Date
  horaInicio    String    @map("hora_inicio")
  horaFin       String    @map("hora_fin")
  estado        String    @default("confirmada")
  notasAlumno   String?   @map("notas_alumno")
  createdAt     DateTime  @default(now()) @map("created_at")
  canceladaEn   DateTime? @map("cancelada_en")

  alumnoUser    User      @relation("AlumnoReservas", fields: [alumnoUserId], references: [id])
  profesor      User      @relation("ProfesorReservas", fields: [profesorId], references: [id])
  notificaciones Notificacion[]

  @@map("reservas")
}
```

### Model: Notificacion

```prisma
model Notificacion {
  id           String           @id @default(uuid())
  userId       String           @map("user_id")
  tipo         NotificationType
  titulo       String
  mensaje      String
  leida        Boolean          @default(false)
  reservaId    String?          @map("reserva_id")
  emailEnviado Boolean          @default(false) @map("email_enviado")
  createdAt    DateTime         @default(now()) @map("created_at")

  user         User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  reserva      Reserva?         @relation(fields: [reservaId], references: [id])

  @@map("notificaciones")
}

enum NotificationType {
  RESERVA_NUEVA
  RESERVA_CANCELADA
  CLASE_MODIFICADA
  CLASE_CANCELADA
  RECORDATORIO_CLASE
}
```

### Model: VerificationToken (NextAuth)

```prisma
model VerificationToken {
  identifier String
  token      String
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}
```

---

## 6. API ROUTES - ESPECIFICACION COMPLETA

### GET /api/alumnos

**Autenticacion:** Requerida
**Retorna:**
```typescript
{
  alumnos: Alumno[],
  packs: Pack[],
  precioPorClase: string
}
```

**Calculos especiales:**
- Incluye `_count.clases` y `_count.pagos` de cada alumno
- Calcula `clasesEsteMes` filtrando clases en mes actual
- Obtiene `proximoPagoVencimiento` del pago pendiente mas cercano
- Serializa `precio` y `saldoAFavor` a strings (Decimal)

### POST /api/alumnos

**Actions soportadas:**

#### action: "create"
```json
{
  "action": "create",
  "nombre": "string (requerido)",
  "email": "string (requerido, formato email)",
  "telefono": "string (requerido)",
  "genero": "string (opcional, default 'F')",
  "cumpleanos": "string YYYY-MM-DD (opcional)",
  "patologias": "string (opcional)",
  "packType": "string (requerido, ID del pack o 'por_clase')",
  "precio": "number (requerido, >= 0)",
  "consentimientoTutor": "boolean (opcional)",
  "diaInicioCiclo": "number 1-28 (opcional, default 1)"
}
```

**Validaciones:**
- Email, nombre, telefono obligatorios
- Formato de email valido
- Precio >= 0
- diaInicioCiclo clamped a [1, 28]

**Respuesta:** `{ success: true, alumno: Alumno }`

#### action: "update"
Mismos campos que create, pero incluye `id`.

**Caracteristica especial - Prorrateo:**
- Si cambia de pack (y no es desde/hacia "por_clase"), calcula prorrateo automaticamente
- Usa `calcularRangoCiclo()` del alumno para determinar clases tomadas en el ciclo actual
- Actualiza `saldoAFavor` con la diferencia

**Respuesta:** `{ success: true, alumno: Alumno, prorrateoAplicado: boolean, nuevoSaldo: string }`

#### action: "toggleStatus"
```json
{ "action": "toggleStatus", "id": "string" }
```
Activa/desactiva un alumno (sin borrar).

#### action: "delete"
```json
{ "action": "delete", "id": "string" }
```
Borra un alumno y sus clases/pagos (cascada en Prisma).

---

### GET /api/clases

**Autenticacion:** Requerida
**Retorna:**
```typescript
{
  clases: ClaseAPI[],
  alumnos: AlumnoSimple[],
  packs: Pack[],
  currentUserId: string,
  horarioMananaInicio: string,
  horarioMananaFin: string,
  horarioTardeInicio: string,
  horarioTardeFin: string,
  precioPorClase: string,
  maxAlumnosPorClase: number,
  horasAnticipacionMinima: number
}
```

**Especiales:**
- Retorna error 400 si faltan preferencias (packs, horarios o alumnos)
- Si user tiene `espacioCompartidoId`, incluye clases de TODOS los profesores en ese espacio
- Calcula `clasesUsadasEsteMes` usando `diaInicioCiclo` personalizado de cada alumno
- Rango de fechas: -1 mes a +2 meses

### POST /api/clases

**Actions soportadas:**

#### action: "create"
```json
{
  "action": "create",
  "alumnoIds": ["string"],           // Array de IDs de alumnos
  "horaInicio": "string HH:MM",
  "horaRecurrente": "string HH:MM (opcional)",
  "esClasePrueba": "boolean",
  "esRecurrente": "boolean",
  "frecuenciaSemanal": "number (opcional)",
  "diasSemana": "[number] (opcional, 0-6)",
  "fecha": "string YYYY-MM-DD"
}
```

**Validaciones:**
1. Fecha al menos X horas en el futuro (`horasAnticipacionMinima`)
2. Hora dentro de rango de horarios configurados (manana/tarde)
3. Para sabado/domingo, verifica `HorarioDisponible` especifico
4. No excede `maxAlumnosPorClase` en ese horario
5. Todos los alumnos pertenecen al profesor

**Comportamiento especial:**
- Crea UNA clase por alumno en la lista
- Si `esRecurrente`, genera 8 semanas de clases automaticamente
- Sincroniza con Google Calendar en background (fire-and-forget)

#### action: "update"
Mismos campos, permite que `alumnoId` sea null (clase disponible).

#### action: "delete"
```json
{ "action": "delete", "id": "string" }
```
Elimina la clase y el evento de Google Calendar si existe.

#### action: "changeStatus"
```json
{ "action": "changeStatus", "id": "string", "estado": "string" }
```
Estados: "reservada" -> "completada" -> "cancelada"

#### action: "changeAsistencia"
```json
{ "action": "changeAsistencia", "id": "string", "asistencia": "string" }
```
Asistencia: "pendiente" -> "presente" -> "ausente"
**Efecto:** Tambien cambia estado a "completada" (excepto si es "pendiente")

---

### GET /api/pagos

**Query params:**
- `alumnoId` (opcional): Solo pagos de este alumno

**Retorna:**
```typescript
{
  pagos: Pago[],
  alumnos: AlumnoPago[]  // Solo alumnos activos
}
```

**Calculos:**
- Para cada pago mensual, cuenta clases "completada" en ese mes
- Optimizado: una sola query para todas las clases, luego agrupa en memoria

### POST /api/pagos

**Actions soportadas:**

#### action: "create"
```json
{
  "action": "create",
  "alumnoId": "string",
  "monto": "number",
  "fechaVencimiento": "string ISO",
  "mesCorrespondiente": "string",
  "tipoPago": "mensual | clase (opcional)",
  "clasesEsperadas": "number (opcional)"
}
```

**Comportamiento especial:**
- Si alumno tiene `saldoAFavor != 0`, lo limpia al crear pago
- Si `tipoPago` no especificado, detecta segun `alumno.packType`
- Retorna `saldoAplicado` en la respuesta

#### action: "marcarPagado"
```json
{ "action": "marcarPagado", "id": "string" }
```
Cambia estado a "pagado" y establece `fechaPago = now()`

#### action: "marcarPendiente"
```json
{ "action": "marcarPendiente", "id": "string" }
```
Cambia estado a "pendiente" y limpia `fechaPago`

#### action: "delete"
```json
{ "action": "delete", "id": "string" }
```

---

### GET /api/configuracion

**Retorna:**
```typescript
{
  profesor: ProfesorConfig,
  horarios: HorarioDisponible[],
  packs: Pack[]
}
```

### POST /api/configuracion

**Actions soportadas:**

- `saveHorario`: Crear o actualizar horario disponible
- `saveHorariosBatch`: Crear multiples horarios (para wizard)
- `deleteHorario`: Eliminar horario
- `toggleHorario`: Activar/desactivar horario
- `savePack`: Crear o actualizar pack
- `deletePack`: Eliminar pack
- `updateProfile`: Actualizar nombre y telefono
- `changePassword`: Cambiar contrasena (requiere actual)
- `updatePreferencias`: Actualizar horarios, turnos, espacioCompartido, etc.

---

### GET /api/dashboard

**Retorna:**
```typescript
{
  totalAlumnos: number,
  clasesHoy: ClaseHoy[],
  pagosVencidos: number,
  horarioTardeInicio: string,
  maxAlumnosPorClase: number,
  siguienteClase: SiguienteClase | null,
  setupStatus: SetupStatus
}
```

**Calculos:**
- `clasesHoy`: Clases de HOY ordenadas por hora
- `pagosVencidos`: Pagos pendientes con fechaVencimiento < hoy
- `siguienteClase`: Primera clase de manana (si existe)
- `setupStatus`: Flags para mostrar wizard si es nuevo usuario

---

### GET /api/auth/me
Retorna usuario actual y su rol.

### POST /api/auth/login
Login con email/password (credentials).

### GET/POST /api/auth/[...nextauth]
Handlers de NextAuth (Google OAuth + Credentials).

---

## 7. TIPOS TYPESCRIPT

Archivo: `lib/types.ts`

```typescript
// ===== ALUMNOS =====
type Alumno = {
  id: string
  nombre: string
  email: string
  telefono: string
  genero: string
  cumpleanos: string | null
  patologias: string | null
  packType: string
  clasesPorMes: number | null
  precio: string
  estaActivo: boolean
  consentimientoTutor?: boolean
  diaInicioCiclo: number
  saldoAFavor: string
  proximoPagoVencimiento: string | null
  clasesEsteMes: number
  _count: { clases: number; pagos: number }
}

type AlumnoSimple = { id: string; nombre: string }

type AlumnoClase = {
  id: string
  nombre: string
  clasesPorMes: number | null
}

type AlumnoPago = {
  id: string
  nombre: string
  precio: string
  packType: string
  diaInicioCiclo: number
  saldoAFavor: string
}

// ===== CLASES =====
type ClaseAPI = {
  id: string
  fecha: string
  horaInicio: string
  horaRecurrente: string | null
  estado: string              // reservada, completada, cancelada
  asistencia: string          // pendiente, presente, ausente
  esClasePrueba: boolean
  esRecurrente: boolean
  frecuenciaSemanal: number | null
  diasSemana: number[]
  profesorId: string
  alumnoId: string | null
  alumno: AlumnoClase | null
  profesor: { id: string; nombre: string }
  clasesUsadasEsteMes: number
}

type Clase = Omit<ClaseAPI, 'fecha'> & { fecha: Date }

// ===== PAGOS =====
type Pago = {
  id: string
  monto: string
  fechaPago: string | null
  fechaVencimiento: string
  estado: string              // pendiente, pagado
  mesCorrespondiente: string
  tipoPago: string            // mensual, clase
  clasesEsperadas: number | null
  clasesCompletadas: number
  alumno: { id: string; nombre: string; email: string }
}

// ===== PACKS =====
type Pack = {
  id: string
  nombre: string
  clasesPorSemana: number
  precio: string
}

// ===== HORARIOS =====
type Horario = {
  id: string
  diaSemana: number
  horaInicio: string
  horaFin: string
  esManiana: boolean
  estaActivo: boolean
}

// ===== PROFESOR =====
type Profesor = {
  id: string
  nombre: string
  email: string
}

type ProfesorConfig = {
  id: string
  nombre: string
  email: string
  telefono: string | null
  horasAnticipacionMinima: number
  maxAlumnosPorClase: number
  horarioMananaInicio: string
  horarioMananaFin: string
  turnoMananaActivo: boolean
  horarioTardeInicio: string
  horarioTardeFin: string
  turnoTardeActivo: boolean
  espacioCompartidoId: string | null
  syncGoogleCalendar: boolean
  precioPorClase: string
}

// ===== DATA TYPES (respuestas de APIs) =====
type AlumnosData = {
  alumnos: Alumno[]
  packs: Pack[]
  precioPorClase: string
}

type CalendarioData = {
  clases: Clase[]
  alumnos: AlumnoSimple[]
  packs: Pack[]
  currentUserId: string
  horarioMananaInicio: string
  horarioMananaFin: string
  horarioTardeInicio: string
  horarioTardeFin: string
  precioPorClase: string
  maxAlumnosPorClase: number
  horasAnticipacionMinima: number
}

type ConfigData = {
  profesor: ProfesorConfig
  horarios: Horario[]
  packs: Pack[]
}

type PagosData = {
  pagos: Pago[]
  alumnos: AlumnoPago[]
}

type SetupStatus = {
  hasProfile: boolean
  hasHorarios: boolean
  hasPacks: boolean
  hasAlumnos: boolean
  isComplete: boolean
}

type DashboardData = {
  totalAlumnos: number
  clasesHoy: ClaseHoy[]
  pagosVencidos: number
  horarioTardeInicio: string
  maxAlumnosPorClase: number
  siguienteClase: SiguienteClase | null
  setupStatus: SetupStatus
}
```

---

## 8. VALIDACIONES DEL SISTEMA

Archivo: `lib/validation.ts`

```typescript
validateEmail(email: string): boolean
// Valida formato de email con regex

validateRequired(value: any, fieldName: string): string | null
// Retorna error si value esta vacio

validateDateNotInPast(date: Date, horasAnticipacion?: number): string | null
// Valida que la fecha no este en el pasado (con margen opcional)

validateTimeRange(horaInicio: string, horaFin: string): string | null
// Valida que horaInicio < horaFin

validateMaxLength(value: string, max: number, fieldName: string): string | null
// Valida longitud maxima

validateNumberRange(value: number, min: number, max: number, fieldName: string): string | null
// Valida que number este en rango

validatePrice(value: number | string): string | null
// Valida precio >= 0

validateTimeInRange(hora: string, horarioInicio: string, horarioFin: string, turnoNombre: string): string | null
// Valida que hora este dentro del rango de turno

validateAll(...validations: (string | null)[]): string | null
// Combina multiples validaciones, retorna primer error o null
```

---

## 9. AUTENTICACION

### Providers

1. **Google OAuth**
   - Scope: `openid email profile https://www.googleapis.com/auth/calendar`
   - Access type: `offline` (para refresh tokens)
   - Prompt: `consent` (siempre pedir)

2. **Credentials (Email/Password)**
   - Requiere email y password
   - Verifica contra BD con bcrypt

### Callbacks

#### signIn
- Para Google: Crea usuario si no existe, asigna rol PROFESOR
- Para Credentials: Valida contra BD

#### jwt
- Almacena userId y role en token
- Guarda access_token y refresh_token de Google para Calendar API

#### session
- Inyecta userId, role, accessToken, refreshToken en sesion

### Funciones de Auth (`lib/auth/auth-utils.ts`)

```typescript
hashPassword(password: string): Promise<string>
// Hashea password con bcrypt

verifyPassword(password: string, hashedPassword: string): Promise<boolean>
// Verifica password contra hash

createToken(userId: string): Promise<string>
// Genera JWT con expiracion 7 dias

verifyToken(token: string): Promise<{ userId: string } | null>
// Verifica y decodifica JWT

setAuthCookie(token: string): Promise<void>
// Setea cookie httpOnly, secure, sameSite=lax

removeAuthCookie(): Promise<void>
// Elimina cookie de auth

getCurrentUser(): Promise<string | null>
// Obtiene userId de cookie o sesion NextAuth
```

### Flujo de Login

```
Email/Password Input
       ↓
POST /api/auth/login (Credentials provider)
       ↓
Valida email/password con bcrypt
       ↓
Genera JWT, setea cookie + sesion
       ↓
Redirige a /dashboard
```

---

## 10. GOOGLE CALENDAR INTEGRATION

Archivo: `lib/google-calendar.ts`

### Funciones

```typescript
createCalendarEvent(claseId: string, accessToken: string, refreshToken?: string): Promise<string>
// Crea evento en Google Calendar, retorna eventId

updateCalendarEvent(claseId: string, eventId: string, accessToken: string, refreshToken?: string): Promise<string>
// Actualiza evento existente

deleteCalendarEvent(eventId: string, accessToken: string, refreshToken?: string): Promise<void>
// Elimina evento
```

### Caracteristicas

- **Timezone:** America/Argentina/Buenos_Aires (UTC-3)
- **Duracion:** 1 hora (hardcodeado)
- **Reminders:**
  - Email: 24 horas antes
  - Popup: 1 hora antes
- **Attendees:** Se incluye al alumno si existe
- **Sync automatico:** Fire-and-forget en background
- **Token refresh:** Si access_token expira (401), intenta refrescar con refresh_token

### Uso en APIs

```typescript
if (user.syncGoogleCalendar) {
  auth().then(session => {
    if (session?.accessToken) {
      createCalendarEvent(clase.id, session.accessToken, session.refreshToken)
        .then(eventId => {
          prisma.clase.update({
            where: { id: clase.id },
            data: { googleEventId: eventId }
          })
        })
        .catch(err => console.error('Error:', err))
    }
  })
}
```

---

## 11. CACHE Y DATA FETCHING

### Client Cache (`lib/client-cache.ts`)

```typescript
getCachedData<T>(key: string): T | null
// Obtiene datos del cache

setCachedData<T>(key: string, data: T): void
// Guarda datos en cache

invalidateCache(key?: string): void
// Invalida una key + sus dependencias

invalidateCaches(...keys: string[]): void
// Invalida multiples keys
```

**TTL:** 5 minutos por defecto

**Dependencias de cache:**
- `ALUMNOS` -> invalida CALENDARIO, DASHBOARD, PAGOS
- `CALENDARIO` -> invalida DASHBOARD
- `CONFIGURACION` -> invalida CALENDARIO, DASHBOARD
- `PAGOS` -> invalida DASHBOARD

### usePageData Hook (`lib/use-page-data.ts`)

```typescript
usePageData<T>({
  cacheKey: string,
  apiUrl: string,
  transform?: (data: unknown) => T
}): {
  data: T | null,
  error: string | null,
  isLoading: boolean,
  refresh: () => void
}
```

**Comportamiento:**
- Valida cache primero
- Si cached, retorna inmediatamente
- Si no cached, hace fetch
- Guarda en cache si exito
- Maneja `preferencesIncomplete` y `redirect` especiales
- Refresh limpia cache y re-fetcha

---

## 12. UTILITARIOS DE ALUMNO

Archivo: `lib/alumno-utils.ts`

### Estados de Pago

```typescript
getPaymentStatus(alumno: Alumno): { texto: string; clase: 'al-dia' | 'por-vencer' | 'vencido' } | null
```

**Logica:**
- Si esta inactivo -> null
- Si no tiene vencimiento -> "Al dia"
- Si vencimiento < hoy -> "Pago atrasado" (vencido)
- Si vencimiento = hoy -> "Vence hoy" (por-vencer)
- Si vencimiento <= 7 dias -> "Vence en Xd" (por-vencer)
- Otros -> "Al dia"

### Clases Restantes

```typescript
getClasesRestantes(alumno: Alumno): string | null
getClasesRestantesDetalle(alumno: Alumno): string | null
```

Retorna: `"X clases restantes"` o `"Sin clases disponibles"` o null

### Ciclo de Facturacion

```typescript
type RangoCiclo = { inicio: Date; fin: Date }

calcularRangoCiclo(diaInicioCiclo: number, fechaReferencia?: Date): RangoCiclo
```

**Logica:**
- Si `diaActual >= diaInicioCiclo` -> Ciclo empezo este mes
- Si `diaActual < diaInicioCiclo` -> Ciclo empezo mes pasado
- Retorna rango completo del ciclo actual

**Ejemplo:** Si diaInicioCiclo=15:
- Hoy es 25 de Diciembre -> Ciclo: 15 Dic - 14 Ene
- Hoy es 10 de Diciembre -> Ciclo: 15 Nov - 14 Dic

### Precio Implicito por Clase

```typescript
calcularPrecioImplicitoPorClase(precioPack: number, clasesPorSemana: number): number
```

Formula: `precioPack / (clasesPorSemana * 4)`

### Prorrateo

```typescript
type DatosProrrateo = {
  packAnteriorNombre: string
  packAnteriorPrecio: number
  packAnteriorClasesSemana: number
  packNuevoNombre: string | null
  packNuevoPrecio: number
  clasesTomadas: number
  precioImplicitoPorClase: number
  valorConsumido: number
  montoPagado: number
  saldoAFavor: number  // positivo = a favor, negativo = debe
  rangoCiclo: RangoCiclo
}

calcularProrrateo(
  packAnterior: { nombre: string; precio: number; clasesPorSemana: number },
  packNuevo: { nombre: string; precio: number } | null,
  clasesTomadas: number,
  montoPagado: number,
  diaInicioCiclo: number
): DatosProrrateo
```

**Proceso:**
1. Precio implicito del pack anterior
2. Valor consumido = clasesTomadas * precioImplicito
3. Saldo a favor = montoPagado - valorConsumido
4. Aplica automaticamente al cambiar de pack

### Formateo de Saldo

```typescript
formatearSaldo(saldo: number): string
```

Ejemplos:
- `formatearSaldo(25000)` -> "+$25.000 a favor"
- `formatearSaldo(-10000)` -> "$10.000 a pagar"
- `formatearSaldo(0)` -> "$0"

---

## 13. CONSTANTES

Archivo: `lib/constants.ts`

```typescript
PACK_LABELS = {
  'mensual': 'Mensual',
  'por_clase': 'Por Clase',
  'pack_4': 'Pack 4 Clases',
  '1x': '1 clase/semana',
  '2x': '2 clases/semana',
  '3x': '3 clases/semana',
  // ...
}

DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
DIAS_SEMANA_COMPLETO = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']

MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
         'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

ESTADOS_CLASE = {
  RESERVADA: 'reservada',
  COMPLETADA: 'completada',
  CANCELADA: 'cancelada'
}

ESTADO_LABELS = {
  'reservada': 'Reservada',
  'completada': 'Completada',
  'cancelada': 'Cancelada'
}

ASISTENCIA = {
  PENDIENTE: 'pendiente',
  PRESENTE: 'presente',
  AUSENTE: 'ausente'
}

ASISTENCIA_LABELS = {
  'pendiente': 'Pendiente',
  'presente': 'Presente',
  'ausente': 'Ausente'
}

ESTADOS_PAGO = {
  PENDIENTE: 'pendiente',
  PAGADO: 'pagado'
}
```

---

## 14. FUNCIONES UTILITARIAS GENERALES

Archivo: `lib/utils.ts`

```typescript
cn(...inputs: ClassValue[]): string
// Combina clases con clsx y resuelve conflictos de Tailwind

getErrorMessage(error: unknown): string
// Extrae mensaje de error de cualquier tipo

getTurno(hora: number): 'manana' | 'tarde' | 'noche'
// Determina turno basado en hora del dia

formatearHora(hora: string): string
// "08:00:00" -> "08:00"

formatearFechaDia(fecha: Date | string): string
// Formatea a YYYY-MM-DD
// Detecta si es fecha de DB (UTC medianoche) o local
```

---

## 15. COMPONENTES UI

### Base Components (`components/ui/`)

| Componente | Proposito |
|-----------|-----------|
| button.tsx | Boton con variantes (default, destructive, outline, ghost) |
| input.tsx | Input base |
| label.tsx | Label para inputs |
| dialog.tsx | Modal/Dialog principal (Radix) |
| dialog-base.tsx | Abstraccion para dialogos |
| confirm-modal.tsx | Modal de confirmacion |
| badge.tsx | Etiqueta/pilula con variantes |
| avatar.tsx | Avatar del usuario |
| toast.tsx | Sistema de notificaciones (useToast hook) |
| empty-state.tsx | Estado vacio con icono y accion |
| loading.tsx | Spinner de carga |
| form-field.tsx | Wrapper de campo con label y error |
| section-wrapper.tsx | Wrapper de seccion con titulo |

### Feature Components (`components/`)

| Componente | Proposito |
|-----------|-----------|
| setup-wizard.tsx | Wizard de configuracion inicial para nuevos usuarios |
| preferences-required.tsx | Guard que muestra mensaje si faltan preferencias |
| time-input.tsx | Input especializado para horas (HH:MM) |
| date-input.tsx | Input especializado para fechas |
| select-input.tsx | Select personalizado |
| accordion.tsx | Acordeon reutilizable (Radix) |

---

## 16. ESTILOS Y DESIGN SYSTEM

Archivo: `app/globals.css`

### Color Palette

```css
--background: #141824          /* Dark blue */
--primary: #6E7DF5             /* Bright blue */
--secondary: #556EFF           /* Saturated blue */
--destructive: #EF4444         /* Red */
--success: #22C55E             /* Green */
--warning: #FBE324             /* Yellow */
--muted: rgba(255,255,255,0.5) /* Text muted */
```

### Sistema de Espaciado

```css
--space-xs: 0.25rem   /* 4px */
--space-sm: 0.5rem    /* 8px */
--space-md: 0.75rem   /* 12px */
--space-lg: 1rem      /* 16px */
--space-xl: 1.5rem    /* 24px */
--space-2xl: 2rem     /* 32px */
--space-3xl: 2.5rem   /* 40px */
--space-4xl: 3rem     /* 48px */
```

### Border Radius

```css
--radius-sm: 0.25rem  /* 4px */
--radius-md: 0.375rem /* 6px */
--radius-lg: 0.5rem   /* 8px */
--radius-xl: 0.625rem /* 10px */
--radius-2xl: 0.75rem /* 12px */
--radius-full: 9999px /* Pilula */
```

### Tipografia

- **Font family:** Inter, Cormorant Garamond (serif), Raleway
- **Tamanos:** xs (12px) -> 3xl (32px)
- **Weights:** 400 normal, 500 medium, 600 semibold, 700 bold

### Alturas Estandar

```css
--height-input: 44px
--height-button: 44px
```

---

## 17. REGLAS DE NEGOCIO IMPORTANTES

### Creacion de Clases

1. **Anticipacion minima:** No se puede crear clase con menos de X horas (configurable)
2. **Maximo de alumnos:** Un horario puede tener hasta N alumnos (configurable, default 4)
3. **Validacion de horarios:** Clases deben estar dentro del horario configurado
4. **Fines de semana:** Requieren `HorarioDisponible` especifico
5. **Clases recurrentes:** Generan automaticamente 8 semanas

### Estados de Clase

- `reservada`: Clase programada para el futuro
- `completada`: El alumno asistio
- `cancelada`: Se cancelo la clase

### Asistencia

- `pendiente`: No se registro aun
- `presente`: El alumno asistio
- `ausente`: El alumno no vino

**Relacion:** Al marcar asistencia (presente/ausente), la clase pasa a "completada"

### Sistema de Pagos

- Alumnos con pack mensual generan UN pago por mes con `clasesEsperadas`
- Alumnos que pagan por clase generan pagos individuales
- Se trackean clases completadas vs esperadas
- Al crear pago, se aplica automaticamente `saldoAFavor` del alumno

### Ciclo de Facturacion Personalizado

- Cada alumno tiene `diaInicioCiclo` (1-28)
- Si un alumno tiene `diaInicioCiclo = 15`, su ciclo va del 15 de cada mes al 14 del siguiente
- Las clases usadas se calculan dentro del rango del ciclo, no del mes calendario
- Al crear pago, se precarga automaticamente el dia de vencimiento con `diaInicioCiclo`

### Sistema de Prorrateo (cambio de pack)

Cuando un alumno cambia de pack a mitad de ciclo:
1. Calcula **precio implicito por clase** del pack anterior: `precio / (clasesPorSemana * 4)`
2. Cuenta **clases tomadas** en el ciclo actual
3. Calcula **valor consumido**: `clasesTomadas * precioImplicitoPorClase`
4. Obtiene **monto pagado** del ultimo pago del ciclo
5. Calcula **saldo**: `montoPagado - valorConsumido`
   - Positivo = saldo a favor (credito)
   - Negativo = debe (debito)
6. Guarda en `saldoAFavor` y se aplica al proximo pago

**Ejemplo:**
- Alumno tenia Pack 8 clases ($40,000), cambio a Pack 12 ($55,000)
- Ciclo actual: 15/dic - 14/ene
- Clases tomadas: 3
- Precio implicito: $40,000 / 8 = $5,000 por clase
- Valor consumido: 3 * $5,000 = $15,000
- Habia pagado: $40,000
- Saldo a favor: $40,000 - $15,000 = $25,000

### Manana vs Tarde

- La deteccion usa `horarioTardeInicio` del usuario
- Si hora de clase < horarioTardeInicio -> manana
- Si hora >= horarioTardeInicio -> tarde

### Espacio Compartido

- Profesores con mismo `espacioCompartidoId` ven clases de todos en calendario
- Sirve para evitar conflictos en espacio fisico compartido
- Cada profesor sigue gestionando solo SUS alumnos y pagos

---

## 18. FLUJOS PRINCIPALES

### 1. Onboarding / Setup Wizard

El profesor nuevo ve un asistente que lo guia para configurar:
1. **Perfil:** Nombre, telefono, genero
2. **Horarios:** Turnos de trabajo (manana/tarde) para cada dia
3. **Packs:** Crear al menos un pack con precio
4. **Primer Alumno:** Registrar su primer alumno

Hasta completar estos pasos, el sistema muestra el wizard en lugar del dashboard.

**Verificacion (`setupStatus`):**
- `hasProfile`: nombre no vacio
- `hasHorarios`: al menos 1 horario disponible
- `hasPacks`: al menos 1 pack
- `hasAlumnos`: al menos 1 alumno activo
- `isComplete`: todos true

### 2. Dashboard

- Vista con resumen del dia
- Total de alumnos activos
- Clases de hoy con hora y alumno
- Pagos vencidos
- Siguiente clase (de manana)

### 3. Calendario

- Vista de semana completa (desktop) o dia (mobile)
- Clases agrupadas por hora
- Badge con nombre del alumno
- Estados visuales: verde (completada), rojo (cancelada), naranja (ausente)
- Modo seleccion para cambiar estado de multiples clases

### 4. Gestion de Alumnos

- CRUD completo
- Toggle activo/inactivo
- Asignacion de pack y precio
- Configuracion de dia de inicio de ciclo (solo para packs mensuales)
- Al editar y cambiar pack, se calcula automaticamente el prorrateo

### 5. Pagos

- Ver pagos pendientes y vencidos
- Marcar como pagado
- Crear pagos manuales
- Ver progreso de clases del mes (completadas/esperadas)
- Al seleccionar alumno, se precarga:
  - Dia de vencimiento segun su `diaInicioCiclo`
  - Monto ajustado si tiene `saldoAFavor`

### 6. Configuracion

- Datos personales (nombre, telefono)
- Cambio de contrasena
- Horarios de trabajo (lunes-viernes general, sabado/domingo especifico)
- Preferencias (anticipacion, max alumnos, etc.)
- Packs disponibles
- Precio por clase individual
- Integracion Google Calendar

---

## 19. VARIABLES DE ENTORNO

```env
# Base de datos
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Auth
JWT_SECRET=...     # Para custom JWT (credentials)
AUTH_SECRET=...    # Para NextAuth

# Ambiente
NODE_ENV=development|production
```

---

## 20. CONFIGURACION NEXT.JS

Archivo: `next.config.ts`

```typescript
{
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  serverExternalPackages: ['@prisma/client', 'bcrypt']
}
```

---

## 21. COMANDOS UTILES

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Start produccion
npm start

# Prisma
npx prisma migrate dev --name <nombre>
npx prisma db push          # Push sin migracion
npx prisma studio           # UI para ver datos
npx prisma generate         # Regenerar cliente

# ESLint
npm run lint
```

---

## 22. PROBLEMAS CONOCIDOS Y SOLUCIONES

### Inputs Condicionales

```tsx
// MAL - causa problemas de hidratacion
<input name={condition ? "field" : ""} />

// BIEN
{condition && <input name="field" />}
```

### Cards de Horarios Desalineadas

```css
.horario-dia-content {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;  /* NO center */
  height: 72px;
}
```

### Turbopack Panic

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -Path '.next' -Recurse -Force
npm run dev
```

---

## 23. NOTAS TECNICAS ADICIONALES

1. **Timezone:** Todo usa timezone Argentina fijo, no depende del navegador ni del SO
2. **Fechas en DB:** Se guardan como UTC, se convierten a Argentina para mostrar
3. **Multi-tenancy:** Cada profesor solo ve sus propios datos (filtrado por `profesorId`)
4. **Validaciones:** Todas las validaciones de horarios/anticipacion se hacen en el servidor
5. **Prorrateo automatico:** Al cambiar pack de un alumno, el backend calcula y guarda el saldo
6. **Google Calendar:** Solo sincroniza si `user.syncGoogleCalendar = true`, fire-and-forget
7. **Clases recurrentes:** Generan 8 semanas automaticamente con `addWeeks` de date-fns
8. **Decimal:** Prisma usa Decimal para montos, se serializa a string en APIs

---

## 24. CASOS DE USO TIPICOS

1. **Profesora abre la app:** Ve dashboard con clases del dia, alumnos totales, pagos vencidos
2. **Crea clase para nuevo alumno de prueba:** Selecciona fecha, hora, marca "clase de prueba"
3. **Alumno viene, termina la clase:** Marca asistencia como "presente" -> clase pasa a "completada"
4. **Alumno no vino:** Marca asistencia como "ausente" para llevar registro
5. **Fin de mes:** Revisa pagos pendientes, marca los pagados, crea nuevos para siguiente mes
6. **Alumno cambia de pack:** Edita alumno, asigna nuevo pack. Sistema calcula prorrateo automaticamente
7. **Nuevo profesor:** Ve Setup Wizard que lo guia paso a paso
8. **Profesores comparten estudio:** Configuran mismo `espacioCompartidoId`, ven clases de todos

---

Este documento contiene toda la informacion necesaria para entender completamente el sistema. Cualquier IA puede usarlo como referencia para implementar nuevas funcionalidades, debuggear problemas o entender la logica de negocio sin necesidad de leer el codigo fuente.

**Ultima actualizacion:** 21 de diciembre de 2025

---

## 25. SEGURIDAD Y CONSIDERACIONES

Para informacion detallada sobre hallazgos de seguridad, ver `AUDIT_REPORT.md`.

### Resumen de seguridad

| Aspecto | Estado | Notas |
|---------|--------|-------|
| Autenticacion en APIs | ✅ | Todas usan `getCurrentUser()` |
| .env en .gitignore | ✅ | Nunca committeado |
| JWT_SECRET configurado | ✅ | En .env |
| Cookies httpOnly | ✅ | Previene XSS |
| Rate limiting | ❌ | No implementado |
| Paginacion | ❌ | Sin limites en queries |
| Soft delete | ❌ | Eliminacion fisica |

### Variables de entorno requeridas

```env
DATABASE_URL          # Supabase pooler URL
DIRECT_URL            # Supabase direct URL
AUTH_SECRET           # NextAuth secret
GOOGLE_CLIENT_ID      # OAuth
GOOGLE_CLIENT_SECRET  # OAuth
JWT_SECRET            # Para credentials login
```
