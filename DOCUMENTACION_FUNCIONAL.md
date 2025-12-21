# Pilates Booking - Documentacion Funcional Completa

## Indice

1. [Vision General](#vision-general)
2. [Stack Tecnologico](#stack-tecnologico)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Base de Datos](#base-de-datos)
5. [Autenticacion y Autorizacion](#autenticacion-y-autorizacion)
6. [APIs y Endpoints](#apis-y-endpoints)
7. [Logica de Negocio](#logica-de-negocio)
8. [Componentes UI](#componentes-ui)
9. [Flujos de Usuario](#flujos-de-usuario)
10. [Configuraciones y Preferencias](#configuraciones-y-preferencias)
11. [Features Pendientes](#features-pendientes)

---

## Vision General

**Pilates Booking** es una aplicacion web para profesores de Pilates que permite gestionar:
- Alumnos y su informacion
- Clases y horarios
- Pagos y facturacion
- Packs de clases con precios personalizados
- Ciclos de facturacion individuales por alumno

La aplicacion esta disenada para un solo profesor (single-tenant) pero soporta "espacios compartidos" donde multiples profesores pueden ver las clases de otros en el calendario.

---

## Stack Tecnologico

| Tecnologia | Version | Uso |
|------------|---------|-----|
| Next.js | 16.0.10 | Framework fullstack con App Router |
| React | 19.2.0 | UI Library |
| TypeScript | 5.x | Tipado estatico |
| PostgreSQL | - | Base de datos (via Supabase) |
| Prisma | 6.19.0 | ORM |
| NextAuth | 5.0.0-beta.30 | Autenticacion (Google OAuth + Credentials) |
| Zod | 4.1.12 | Validacion de schemas |
| Tailwind CSS | 4.x | Estilos (solo en globals.css) |
| Radix UI | Varios | Componentes accesibles (Dialog, Select, etc.) |
| Lucide React | 0.548.0 | Iconos |

### Dependencias Destacadas
- **bcrypt**: Hash de contrasenas
- **jose**: JWT para autenticacion custom
- **googleapis**: Integracion con Google Calendar (proximamente)
- **date-fns**: Manipulacion de fechas
- **react-day-picker**: Selector de fechas

---

## Estructura del Proyecto

```
pilates-booking/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Rutas de autenticacion (sin layout dashboard)
│   │   └── login/                # Login y registro
│   │       ├── page.tsx          # Pagina de login
│   │       ├── login-form.tsx    # Formulario cliente
│   │       └── actions.ts        # Server actions (login, signup)
│   │
│   ├── (dashboard)/              # Rutas protegidas con layout compartido
│   │   ├── layout.tsx            # Layout con sidebar/navbar
│   │   ├── dashboard/            # Vista principal del dia
│   │   ├── alumnos/              # CRUD de alumnos
│   │   ├── calendario/           # Gestion de clases
│   │   ├── pagos/                # Gestion de pagos
│   │   ├── configuracion/        # Preferencias, packs, horarios
│   │   └── perfil/               # Perfil del usuario
│   │
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Endpoints de autenticacion
│   │   │   ├── login/route.ts    # POST login credentials
│   │   │   ├── me/route.ts       # GET usuario actual
│   │   │   └── [...nextauth]/    # NextAuth handlers (Google OAuth)
│   │   │
│   │   └── v1/                   # API versionada
│   │       ├── alumnos/route.ts  # CRUD alumnos
│   │       ├── clases/route.ts   # CRUD clases
│   │       ├── pagos/route.ts    # CRUD pagos
│   │       ├── dashboard/route.ts # Datos del dashboard
│   │       └── configuracion/route.ts # Config profesor
│   │
│   ├── onboarding/               # Seleccion de rol inicial
│   ├── privacy/                  # Pagina de privacidad
│   ├── terms/                    # Terminos y condiciones
│   ├── layout.tsx                # Layout raiz
│   ├── page.tsx                  # Redirect a /dashboard
│   ├── error.tsx                 # Error boundary global
│   ├── not-found.tsx             # Pagina 404
│   └── globals.css               # Estilos globales (Tailwind + custom)
│
├── components/                   # Componentes reutilizables
│   ├── ui/                       # Componentes base (Button, Dialog, etc.)
│   └── *.tsx                     # Componentes especificos
│
├── lib/                          # Utilidades y servicios
│   ├── auth/                     # Autenticacion
│   │   ├── auth.ts               # Configuracion NextAuth
│   │   ├── auth-utils.ts         # JWT, cookies, getCurrentUser
│   │   └── auth.config.ts        # Providers config
│   ├── schemas/                  # Zod schemas para validacion
│   ├── services/                 # Servicios de dominio
│   ├── alumno-utils.ts           # Utilidades de ciclo y prorrateo
│   ├── api-utils.ts              # Helpers para respuestas API
│   ├── rate-limit.ts             # Rate limiting en memoria
│   ├── server-cache.ts           # Cache con unstable_cache
│   ├── client-cache.ts           # Cache del cliente
│   ├── prisma.ts                 # Cliente Prisma singleton
│   └── logger.ts                 # Logging seguro (sin datos sensibles)
│
├── prisma/
│   └── schema.prisma             # Schema de base de datos
│
└── auth.ts                       # Export central de auth
```

---

## Base de Datos

### Diagrama de Entidades

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │───────│     Alumno      │───────│      Pago       │
│   (Profesor)    │ 1   n │                 │ 1   n │                 │
└─────────────────┘       └─────────────────┘       └─────────────────┘
        │                         │
        │ 1                       │ n
        │                         │
        ▼ n                       ▼ 1
┌─────────────────┐       ┌─────────────────┐
│      Pack       │       │      Clase      │
│                 │       │                 │
└─────────────────┘       └─────────────────┘
        │
        │ 1
        ▼ n
┌─────────────────┐
│HorarioDisponible│
└─────────────────┘
```

### Modelo: User (Profesor)

```prisma
model User {
  id                      String    @id @default(uuid())
  email                   String    @unique
  nombre                  String
  telefono                String?
  genero                  String    @default("F")  // "M" o "F"
  password                String?   // null si usa OAuth
  role                    UserRole  @default(PROFESOR)

  // Configuracion de clases
  horasAnticipacionMinima Int       @default(1)     // Horas minimas para reservar
  maxAlumnosPorClase      Int       @default(4)     // Cupo maximo por horario

  // Horarios de trabajo
  horarioMananaInicio     String    @default("08:00")
  horarioMananaFin        String    @default("14:00")
  turnoMananaActivo       Boolean   @default(true)
  horarioTardeInicio      String    @default("17:00")
  horarioTardeFin         String    @default("22:00")
  turnoTardeActivo        Boolean   @default(true)

  // Espacio compartido (para ver clases de otros profes)
  espacioCompartidoId     String?

  // Google Calendar (proximamente)
  syncGoogleCalendar      Boolean   @default(false)
  googleCalendarId        String?

  // Precio por clase suelta
  precioPorClase          Decimal   @default(0)

  // Relaciones
  alumnos                 Alumno[]
  clases                  Clase[]
  packs                   Pack[]
  horariosDisponibles     HorarioDisponible[]
  accounts                Account[]  // OAuth accounts
  sessions                Session[]
}

enum UserRole {
  PROFESOR
  ALUMNO  // Para futuro portal de alumnos
}
```

### Modelo: Alumno

```prisma
model Alumno {
  id                  String    @id @default(uuid())
  profesorId          String    // FK a User
  nombre              String
  email               String
  telefono            String
  cumpleanos          DateTime? @db.Date
  patologias          String?   // Notas medicas/patologias
  genero              String    @default("F")
  consentimientoTutor Boolean   @default(false)  // Para menores

  // Pack y precio
  packType            String    // ID del pack o "por_clase"
  clasesPorMes        Int?      // Calculado del pack
  precio              Decimal   // Precio mensual o por clase

  // Estado
  estaActivo          Boolean   @default(true)
  estaPausada         Boolean   @default(false)  // Vacaciones temporales

  // Ciclo de facturacion personalizado
  diaInicioCiclo      Int       @default(1)  // Dia del mes (1-28)
  saldoAFavor         Decimal   @default(0)  // Credito por prorrateo

  // Google Calendar (proximamente)
  syncGoogleCalendar  Boolean   @default(false)
  googleCalendarId    String?

  // Soft delete
  deletedAt           DateTime?

  // Relaciones
  profesor            User      @relation(...)
  clases              Clase[]
  pagos               Pago[]
}
```

### Modelo: Pack

```prisma
model Pack {
  id              String    @id @default(uuid())
  profesorId      String
  nombre          String    // Ej: "Pack 2 clases", "Pack 3 clases"
  clasesPorSemana Int       // 1, 2, 3, etc.
  precio          Decimal   // Precio mensual
  deletedAt       DateTime? // Soft delete

  profesor        User      @relation(...)
}
```

**Logica de clases por mes:**
- `clasesPorMes = clasesPorSemana * 4`
- Ejemplo: Pack 2 clases/semana = 8 clases/mes

### Modelo: HorarioDisponible

```prisma
model HorarioDisponible {
  id         String    @id @default(uuid())
  profesorId String
  diaSemana  Int       // 0=Domingo, 1=Lunes, ..., 6=Sabado
  horaInicio String    // "09:00"
  horaFin    String    // "12:00"
  esManiana  Boolean   // true=manana, false=tarde
  estaActivo Boolean   @default(true)
  deletedAt  DateTime?

  profesor   User      @relation(...)
}
```

**Nota:** Los horarios de Lunes a Viernes se derivan de la configuracion general del User. Los HorarioDisponible son para dias especiales (sabados/domingos) o excepciones.

### Modelo: Clase

```prisma
model Clase {
  id                String    @id @default(uuid())
  profesorId        String
  alumnoId          String?   // null = horario disponible sin reserva
  fecha             DateTime  @db.Date
  horaInicio        String    // "09:00"
  horaRecurrente    String?   // Para clases recurrentes con hora diferente

  // Recurrencia
  esRecurrente      Boolean   @default(false)
  frecuenciaSemanal Int?      // 1, 2, etc. (cada cuantas semanas)
  diasSemana        Int[]     // [1, 3, 5] = Lun, Mie, Vie

  // Estado
  estado            String    @default("reservada")  // reservada, completada, cancelada
  asistencia        String    @default("pendiente")  // pendiente, presente, ausente
  esClasePrueba     Boolean   @default(false)

  // Google Calendar (proximamente)
  googleEventId     String?

  // Soft delete
  deletedAt         DateTime?

  // Relaciones
  profesor          User      @relation(...)
  alumno            Alumno?   @relation(...)
}
```

**Estados de clase:**
- `reservada`: Clase agendada, pendiente de realizarse
- `completada`: Clase realizada
- `cancelada`: Clase cancelada

**Estados de asistencia:**
- `pendiente`: No se marco asistencia
- `presente`: Alumno asistio
- `ausente`: Alumno falto

### Modelo: Pago

```prisma
model Pago {
  id                 String    @id @default(uuid())
  alumnoId           String
  monto              Decimal
  fechaPago          DateTime? @db.Date  // null = no pagado aun
  fechaVencimiento   DateTime  @db.Date
  estado             String    @default("pendiente")  // pendiente, pagado
  mesCorrespondiente String    // "2024-12" o "diciembre 2024"

  // Tipo de pago
  tipoPago           String    @default("mensual")  // "mensual" o "clase"
  clasesEsperadas    Int?      // Para pagos mensuales: clases que deberia hacer

  // Soft delete
  deletedAt          DateTime?

  alumno             Alumno    @relation(...)
}
```

### Modelos de Autenticacion (NextAuth)

```prisma
model Account {
  id                String  @id
  userId            String
  type              String
  provider          String  // "google", "credentials"
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?

  user              User    @relation(...)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(...)
}
```

---

## Autenticacion y Autorizacion

### Metodos de Login

1. **Google OAuth** (NextAuth)
   - Configurado via `next-auth`
   - Crea usuario automaticamente si no existe
   - Guarda tokens en tabla `Account`
   - Session almacenada en JWT

2. **Credentials** (Email/Password)
   - Password hasheado con bcrypt (salt rounds: 10)
   - JWT custom firmado con jose (HS256)
   - Token en cookie httpOnly `auth-token`
   - Expiracion: 7 dias

### Flujo de Autenticacion

```
┌─────────────────────────────────────────────────────────────────┐
│                        LOGIN FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────┐     ┌─────────────┐     ┌───────────────────────┐  │
│  │ Usuario │────▶│ /login page │────▶│ Seleccionar metodo    │  │
│  └─────────┘     └─────────────┘     └───────────────────────┘  │
│                                                │                 │
│                         ┌──────────────────────┴────────┐        │
│                         ▼                               ▼        │
│              ┌─────────────────┐             ┌─────────────────┐│
│              │  Google OAuth   │             │   Credentials   ││
│              └────────┬────────┘             └────────┬────────┘│
│                       │                               │         │
│                       ▼                               ▼         │
│              ┌─────────────────┐             ┌─────────────────┐│
│              │ NextAuth JWT    │             │ Custom JWT      ││
│              │ (session cookie)│             │ (auth-token)    ││
│              └────────┬────────┘             └────────┬────────┘│
│                       │                               │         │
│                       └───────────────┬───────────────┘         │
│                                       ▼                         │
│                              ┌─────────────────┐                │
│                              │ getCurrentUser()│                │
│                              │ Verifica ambos  │                │
│                              └────────┬────────┘                │
│                                       │                         │
│                                       ▼                         │
│                              ┌─────────────────┐                │
│                              │    userId       │                │
│                              └─────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

### Funcion `getCurrentUser()`

```typescript
// lib/auth/auth-utils.ts
export async function getCurrentUser() {
  const cookieStore = await cookies()

  // 1. Primero intentar con JWT custom (credentials login)
  const customToken = cookieStore.get('auth-token')?.value
  if (customToken) {
    const payload = await verifyToken(customToken)
    if (payload) return payload.userId
  }

  // 2. Usar NextAuth para OAuth (Google)
  try {
    const session = await auth()
    if (session?.user?.id) {
      return session.user.id
    }
  } catch {
    // Ignore errors
  }

  return null
}
```

### Proteccion de Rutas

- **Middleware (`proxy.ts`)**: Redirige a `/login` si no hay sesion
- **API Routes**: Cada endpoint valida con `getCurrentUser()`
- **Server Components**: Pueden acceder a la sesion directamente

---

## APIs y Endpoints

### Estructura General

Todos los endpoints siguen el patron:
- Validacion de autenticacion con `getCurrentUser()`
- Validacion de input con Zod schemas
- Rate limiting en endpoints sensibles
- Respuestas estandarizadas via `api-utils.ts`
- Soft delete (campo `deletedAt`)

### Rate Limiting

```typescript
// lib/rate-limit.ts
// Implementacion en memoria (se resetea al reiniciar)
// Limites por endpoint:
// - POST /api/v1/alumnos: 30 req/min
// - POST /api/v1/clases: 30 req/min
// - POST /api/v1/pagos: 20 req/min
// - POST /api/v1/configuracion: 20 req/min
```

### Endpoint: Dashboard

**GET `/api/v1/dashboard`**

Retorna datos para la vista principal:

```typescript
{
  totalAlumnos: number,        // Alumnos activos
  clasesHoy: ClaseHoy[],       // Clases del dia
  pagosVencidos: number,       // Pagos pendientes vencidos
  horarioTardeInicio: string,  // Para distinguir turnos
  maxAlumnosPorClase: number,
  siguienteClase: {            // Proxima clase (hoy o manana)
    hora: string,
    cantAlumnos: number,
    esMañana: boolean
  } | null,
  setupStatus: {               // Para wizard inicial
    hasHorarios: boolean,
    hasPacks: boolean,
    hasAlumnos: boolean,
    userName: string | null
  }
}
```

### Endpoint: Alumnos

**GET `/api/v1/alumnos`**

Query params:
- `page`: Numero de pagina (default: 1)
- `limit`: Items por pagina (default: 50)
- `search`: Busqueda por nombre o email

Retorna:
```typescript
{
  data: Alumno[],
  total: number,
  page: number,
  limit: number,
  totalPages: number,
  alumnos: Alumno[],           // Compatibilidad
  packs: Pack[],               // Para el form
  precioPorClase: string       // Precio clase suelta
}
```

**POST `/api/v1/alumnos`**

Actions:
- `create`: Crear alumno
- `update`: Actualizar alumno (con calculo de prorrateo si cambia pack)
- `toggleStatus`: Activar/desactivar
- `delete`: Soft delete

### Endpoint: Clases

**GET `/api/v1/clases`**

Retorna clases de los ultimos 2 meses y proximos 2 meses.

Incluye:
- Verificacion de preferencias configuradas
- Alumnos para el form de reserva
- Packs disponibles
- Configuracion de horarios

**POST `/api/v1/clases`**

Actions:
- `create`: Crear clase(s) - soporta multiples alumnos
- `update`: Modificar clase
- `delete`: Soft delete
- `changeStatus`: Cambiar estado (reservada/completada/cancelada)
- `changeAsistencia`: Marcar presente/ausente/pendiente

Validaciones:
- Horas de anticipacion minima
- Horarios dentro del rango configurado
- Cupo maximo por horario
- Horarios de fin de semana (si estan configurados)

### Endpoint: Pagos

**GET `/api/v1/pagos`**

Query params:
- `alumnoId`: Filtrar por alumno
- `estado`: Filtrar por estado (pendiente/pagado)

Incluye calculo de `clasesCompletadas` para mostrar progreso.

**POST `/api/v1/pagos`**

Actions:
- `create`: Crear pago (limpia saldo a favor del alumno)
- `marcarPagado`: Marcar como pagado
- `marcarPendiente`: Revertir a pendiente
- `delete`: Soft delete

### Endpoint: Configuracion

**GET `/api/v1/configuracion`**

Retorna:
- Datos del profesor
- Horarios disponibles
- Packs configurados
- Estado de cuenta Google

**POST `/api/v1/configuracion`**

Actions:
- `saveHorario`: Guardar un horario
- `saveHorariosBatch`: Guardar multiples horarios
- `deleteHorario`: Eliminar horario
- `toggleHorario`: Activar/desactivar horario
- `savePack`: Crear/editar pack
- `deletePack`: Eliminar pack (valida que no tenga alumnos)
- `updateProfile`: Actualizar nombre/telefono
- `changePassword`: Cambiar contrasena
- `updatePreferencias`: Actualizar configuracion general

---

## Logica de Negocio

### Sistema de Packs

Los packs definen cuantas clases por semana puede tomar un alumno y a que precio:

```typescript
// Ejemplo de packs
const packs = [
  { nombre: "1 clase/semana", clasesPorSemana: 1, precio: 25000 },
  { nombre: "2 clases/semana", clasesPorSemana: 2, precio: 45000 },
  { nombre: "3 clases/semana", clasesPorSemana: 3, precio: 60000 },
]

// Clases esperadas por mes = clasesPorSemana * 4
// Pack 2 clases = 8 clases/mes
```

### Ciclo de Facturacion Personalizado

Cada alumno puede tener su propio dia de inicio de ciclo:

```typescript
// lib/alumno-utils.ts
function calcularRangoCiclo(diaInicioCiclo: number, fechaReferencia: Date): RangoCiclo {
  // Si diaInicioCiclo = 15 y hoy es 20 de diciembre:
  // Ciclo actual: 15/dic - 14/ene

  // Si hoy es 10 de diciembre:
  // Ciclo actual: 15/nov - 14/dic
}
```

Esto permite:
- Alumnos que empiezan a mitad de mes
- Facturacion no alineada al mes calendario
- Prorrateo correcto al cambiar de pack

### Sistema de Prorrateo

Cuando un alumno cambia de pack, se calcula el saldo a favor o a pagar:

```typescript
// lib/alumno-utils.ts

// 1. Calcular precio implicito por clase del pack anterior
function calcularPrecioImplicitoPorClase(precioPack: number, clasesPorSemana: number): number {
  const clasesEsperadasMes = clasesPorSemana * 4
  return precioPack / clasesEsperadasMes
  // Pack $45000, 2/sem = $45000 / 8 = $5625/clase
}

// 2. Calcular prorrateo
function calcularProrrateo(packAnterior, packNuevo, clasesTomadas, montoPagado, diaInicioCiclo) {
  const precioImplicito = calcularPrecioImplicitoPorClase(packAnterior.precio, packAnterior.clasesPorSemana)
  const valorConsumido = clasesTomadas * precioImplicito
  const saldoAFavor = montoPagado - valorConsumido

  // Ejemplo:
  // - Pack anterior: 2 clases/sem, $45000
  // - Clases tomadas en ciclo: 4
  // - Monto pagado: $45000
  // - Valor consumido: 4 * $5625 = $22500
  // - Saldo a favor: $45000 - $22500 = $22500
}
```

El saldo se guarda en `alumno.saldoAFavor` y se aplica automaticamente al crear el proximo pago.

### Estados de Pago

```
┌────────────────────────────────────────────────────────────────┐
│                    CICLO DE PAGO                               │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐   │
│  │   PENDIENTE   │───▶│    PAGADO     │───▶│   ARCHIVADO   │   │
│  │               │◀───│               │    │   (soft del)  │   │
│  └───────────────┘    └───────────────┘    └───────────────┘   │
│                                                                 │
│  Campos:                                                        │
│  - estado: "pendiente" | "pagado"                              │
│  - fechaPago: null | Date (cuando se marco pagado)             │
│  - fechaVencimiento: Date (para alertas)                       │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Clases Recurrentes

Al crear una clase recurrente:

```typescript
// Se crea la clase inicial
// Luego se crean 8 semanas adicionales para cada dia seleccionado

const diasSemana = [1, 3, 5]  // Lunes, Miercoles, Viernes
const frecuenciaSemanal = 1   // Cada semana

// Para cada dia:
for (const dia of diasSemana) {
  // Calcular proxima ocurrencia
  // Crear 8 clases futuras (2 meses)
}
```

### Validaciones de Horario

```typescript
// Al crear/editar clase:

// 1. Anticipacion minima
if (diferenciaHoras < user.horasAnticipacionMinima) {
  throw Error(`Las clases deben reservarse con al menos ${horasTexto} de anticipacion`)
}

// 2. Dentro del horario configurado
if (horaInicio < horarioInicio || horaInicio > horarioFin) {
  throw Error(`El horario de ${turno} configurado es de ${horarioInicio} a ${horarioFin}`)
}

// 3. Cupo maximo
if (clasesEnMismoHorario >= user.maxAlumnosPorClase) {
  throw Error(`Esta clase ya alcanzo el maximo de ${user.maxAlumnosPorClase} alumnos`)
}

// 4. Fin de semana (si no hay horario configurado)
if (!horarioDisponible) {
  throw Error(`No trabajas los ${nombreDia} por la ${turno}`)
}
```

---

## Componentes UI

### Sistema de Toast

```typescript
// components/ui/toast.tsx
// Hook: useToast()

const { showSuccess, showError, showWarning } = useToast()

showSuccess('Clase guardada')
showError('Error al guardar')
```

### Dialogs

Todos los dialogs usan Radix UI Dialog con estilos custom:

```typescript
// components/ui/dialog.tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Titulo</DialogTitle>
    </DialogHeader>
    {/* Contenido */}
  </DialogContent>
</Dialog>
```

### Form Fields

```typescript
// components/ui/form-field.tsx
<FormField label="Email" htmlFor="email" required>
  <input id="email" type="email" />
</FormField>
```

### Empty States

```typescript
// components/ui/empty-state.tsx
<EmptyState
  icon={Users}
  title="No hay alumnos"
  description="Crea tu primer alumno"
  action={{
    label: "Crear alumno",
    onClick: () => setDialogOpen(true)
  }}
/>
```

---

## Flujos de Usuario

### Flujo: Primer Uso (Onboarding)

```
1. Login/Registro
       │
       ▼
2. Seleccion de Rol (Profesor/Alumno*)
       │
       ▼
3. Setup Wizard (si no tiene config)
   ├── Configurar horarios
   ├── Crear packs
   └── Crear primer alumno
       │
       ▼
4. Dashboard

* Rol Alumno: Proximamente
```

### Flujo: Gestion de Clase Diaria

```
1. Dashboard muestra clases de hoy
       │
       ▼
2. Para cada clase:
   ├── Marcar PRESENTE → Clase completada
   └── Marcar AUSENTE  → Clase completada (falta)
       │
       ▼
3. Stats actualizados en tiempo real
```

### Flujo: Creacion de Alumno

```
1. Click "Nuevo Alumno"
       │
       ▼
2. Formulario:
   ├── Datos basicos (nombre, email, telefono)
   ├── Genero y cumpleanos
   ├── Seleccionar Pack → Precio se llena automatico
   ├── Patologias (opcional)
   └── Dia inicio ciclo (default: 1)
       │
       ▼
3. Guardar → Alumno creado
```

### Flujo: Cambio de Pack

```
1. Editar alumno → Cambiar pack
       │
       ▼
2. Sistema calcula prorrateo:
   ├── Precio implicito por clase del pack anterior
   ├── Clases tomadas en ciclo actual
   ├── Valor consumido
   └── Saldo a favor/pagar
       │
       ▼
3. Saldo guardado en alumno.saldoAFavor
       │
       ▼
4. Proximo pago aplica saldo automaticamente
```

### Flujo: Creacion de Pago

```
1. Click "Nuevo Pago"
       │
       ▼
2. Seleccionar alumno
   (Si tiene saldo a favor, se muestra)
       │
       ▼
3. Ingresar monto y fecha vencimiento
       │
       ▼
4. Guardar:
   ├── Pago creado con estado "pendiente"
   └── Saldo a favor del alumno se resetea a 0
       │
       ▼
5. Cuando paga → Marcar como "pagado"
```

---

## Configuraciones y Preferencias

### Preferencias del Profesor

| Campo | Descripcion | Default |
|-------|-------------|---------|
| `horasAnticipacionMinima` | Horas minimas para reservar | 1 |
| `maxAlumnosPorClase` | Cupo por horario | 4 |
| `horarioMananaInicio` | Inicio turno manana | "08:00" |
| `horarioMananaFin` | Fin turno manana | "14:00" |
| `turnoMananaActivo` | Trabaja a la manana | true |
| `horarioTardeInicio` | Inicio turno tarde | "17:00" |
| `horarioTardeFin` | Fin turno tarde | "22:00" |
| `turnoTardeActivo` | Trabaja a la tarde | true |
| `precioPorClase` | Precio clase suelta | 0 |
| `espacioCompartidoId` | Codigo para ver clases de otros | null |

### Espacio Compartido

Si multiples profesores usan el mismo `espacioCompartidoId`:
- Ven las clases de todos en el calendario
- Cada uno gestiona solo sus alumnos
- Util para estudios compartidos

---

## Features Pendientes

### Google Calendar Sync (Proximamente)

El codigo esta comentado pero listo:

```typescript
// Cuando se implemente:
// 1. Al crear clase → Crear evento en Google Calendar
// 2. Al modificar → Actualizar evento
// 3. Al eliminar → Eliminar evento
// 4. Alumnos reciben invitacion por email
```

UI muestra "Proximamente" en configuracion.

### Portal de Alumnos (Proximamente)

- Login para alumnos
- Ver sus clases programadas
- Reservar/cancelar clases
- Ver historial de pagos

---

## Cache y Performance

### Server Cache (unstable_cache)

```typescript
// lib/server-cache.ts

// Packs: 1 hora
getCachedPacks(profesorId)

// Horarios: 1 hora
getCachedHorarios(profesorId)

// Config profesor: 30 min
getCachedProfesorConfig(profesorId)

// Alumnos (para selects): 5 min
getCachedAlumnosSimple(profesorId)
```

### Invalidacion

```typescript
// lib/cache-utils.ts
import { revalidateTag } from 'next/cache'

invalidatePacks()    // revalidateTag('packs')
invalidateHorarios() // revalidateTag('horarios')
invalidateConfig()   // revalidateTag('config')
invalidateAlumnos()  // revalidateTag('alumnos')
```

### Client Cache

```typescript
// lib/client-cache.ts
// Cache en memoria del cliente para evitar re-fetches

invalidateCache(CACHE_KEYS.DASHBOARD)
invalidateCache(CACHE_KEYS.CALENDARIO)
```

---

## Services (Capa de Dominio)

### AlumnoService

```typescript
// lib/services/alumno.service.ts

class AlumnoService {
  constructor(profesorId: string)

  // Crear alumno con ciclo personalizado
  async create(data: CreateAlumnoData): Promise<Alumno>

  // Actualizar con calculo de prorrateo automatico
  async update(id: string, data: UpdateAlumnoData): Promise<{
    alumno: Alumno,
    prorrateoAplicado: boolean,
    nuevoSaldo: string
  }>

  // Soft delete
  async softDelete(id: string): Promise<{ success: true }>

  // Activar/desactivar
  async toggleStatus(id: string): Promise<{ success: true }>
}
```

### PagoService

```typescript
// lib/services/pago.service.ts

class PagoService {
  constructor(profesorId: string)

  // Crear pago (aplica saldo a favor si existe)
  async create(data: CreatePagoData): Promise<{
    pago: Pago,
    saldoAplicado: number
  }>

  // Marcar como pagado
  async marcarPagado(id: string): Promise<{ pago: Pago }>

  // Revertir a pendiente
  async marcarPendiente(id: string): Promise<{ pago: Pago }>

  // Soft delete
  async softDelete(id: string): Promise<{ success: true }>
}
```

---

## Constantes del Sistema

```typescript
// lib/constants.ts

// Etiquetas de packs (para mostrar en UI)
PACK_LABELS = {
  'mensual': 'Mensual',
  'por_clase': 'Por Clase',
  '1x': '1 clase/semana',
  '2x': '2 clases/semana',
  '3x': '3 clases/semana',
  'clase': 'Clase suelta'
}

// Dias de la semana
DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
DIAS_SEMANA_COMPLETO = ['Domingo', 'Lunes', 'Martes', ...]

// Meses
MESES = ['Enero', 'Febrero', 'Marzo', ...]

// Estados de CLASE (ciclo de vida)
ESTADOS_CLASE = {
  RESERVADA: 'reservada',   // Programada, pendiente
  COMPLETADA: 'completada', // Realizada
  CANCELADA: 'cancelada'    // Anulada
}

// ASISTENCIA del alumno (si estuvo o no)
ASISTENCIA = {
  PENDIENTE: 'pendiente',   // No se marco aun
  PRESENTE: 'presente',     // Vino a clase
  AUSENTE: 'ausente'        // Falto
}

// Estados de PAGO
ESTADOS_PAGO = {
  PENDIENTE: 'pendiente',   // No pagado
  PAGADO: 'pagado'          // Pagado
}
```

**Importante:** Distinguir entre ESTADO de la clase (reservada/completada/cancelada) y ASISTENCIA del alumno (pendiente/presente/ausente). Una clase puede estar "completada" con asistencia "ausente" (el alumno falto pero la clase se dio igual).

---

## Consideraciones de Seguridad

1. **Autenticacion**: JWT firmado con secreto, cookies httpOnly
2. **Autorizacion**: Cada query filtra por `profesorId`
3. **Rate Limiting**: Proteccion contra abuso en todos los POST
4. **Validacion**: Zod schemas en todos los inputs
5. **Soft Delete**: Datos nunca se eliminan fisicamente
6. **Logging Seguro**: No se loguean datos sensibles (passwords, tokens)
7. **HTTPS**: Forzado en produccion

---

## Variables de Entorno Requeridas

```env
# Base de datos
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Autenticacion
JWT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://...

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

*Documento generado automaticamente. Ultima actualizacion: Diciembre 2024*
