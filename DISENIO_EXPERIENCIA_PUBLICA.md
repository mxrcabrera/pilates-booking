# DISEÑO EXPERIENCIA PÚBLICA COMPLETA - DECISIONES CONCRETAS

---

# 1. QUÉ VER EN LOS PRIMEROS 10 SEGUNDOS

## Decisión

**Hero Section con:**
1. Tagline centrado: "Gestioná todo tu estudio de pilates en un solo lugar"
2. Subtagline: "Agenda, alumnos, pagos y asistencia. Desde tus primeros alumnos hasta un equipo completo"
3. Calendario visual (componente real CalendarioClient en modo read-only con datos mock)
4. CTA grande: "Comenzar gratis 14 días"
5. Sub-CTA pequeño: "Sin tarjeta. Cancela cuando quieras"

## Por qué esta decisión

- Calendario visual es el componente más intuitivo del producto
- Usuario entiende en 1 segundo qué hace el producto
- No requiere login, solo visual
- Reutiliza componente existente (CalendarioClient)

---

# 2. SECCIONES EXACTAS DE LA LANDING

## Estructura

### Section 1: Hero (Above the Fold)
- Tagline
- Subtagline
- Calendario visual (modo demo)
- CTA principal
- Sub-CTA

### Section 2: Problem Statement
- Headline: "¿Administrar tu estudio por WhatsApp, Excel y Google Calendar?"
- 3 bullets de pain points:
  - Pierdes tiempo coordinando clases
  - No sabes quién pagó y quién no
  - Olvidas quién viene hoy
- CTA: "Ver cómo funciona"

### Section 3: Solution Grid (4 cards)
- Card 1: "Agenda visual" - Icono calendario + "Ve tu semana completa"
- Card 2: "Alumnos y packs" - Icono users + "Gestioná tus alumnos"
- Card 3: "Pagos automáticos" - Icono dollar + "Cobros automáticos"
- Card 4: "Asistencia y reportes" - Icono chart - "Controlá tu asistencia"

### Section 4: Importación Excel
- Headline: "Trae tus datos desde Excel"
- Subhead: "Si ya tenés alumnos en Excel, importalos en segundos"
- Componente: ExcelImport (modo demo, sin upload real)
- CTA: "Ver cómo funciona"

### Section 5: Use Cases (2 columnas)
- Columna 1: "Para profesor individual"
  - 3 bullets: Agenda, Pagos, Reportes
  - Plan recomendado: Starter o Pro
- Columna 2: "Para estudio con equipo"
  - 3 bullets: Roles, Equipo, Reportes avanzados
  - Plan recomendado: Max

### Section 6: Pricing
- Headline: "Planes simples y transparentes"
- Componente: PlanesClient (reutilizar existente)
- Trial banner destacado
- FAQ (5 preguntas)

### Section 7: CTA Final
- Headline: "Comenzá a organizar tu estudio hoy"
- Subhead: "Trial gratis 14 días. Sin tarjeta."
- CTA: "Comenzar trial gratis"

### Section 8: Footer
- Logo
- Links: Producto, Precios, Contacto
- Legal: Privacy, Terms

---

# 3. COMPONENTES REALES DEL REPOSITORIO A REUTILIZAR

## Componentes Reutilizables Directamente

1. **CalendarioClient** (`app/(dashboard)/calendario/calendario-client.tsx`)
   - Modo: read-only demo
   - Props: demoMode=true, data=mockData
   - Uso: Hero section

2. **PlanesClient** (`app/(dashboard)/planes/planes-client.tsx`)
   - Modo: sin cambios
   - Uso: Section 6 (Pricing)

3. **ExcelImport** (`components/ExcelImport.tsx`)
   - Modo: demo (sin upload real)
   - Uso: Section 4 (Importación Excel)

4. **Charts** (`components/charts.tsx`)
   - Componentes: IngresosChart, ClasesAlumnosChart, AsistenciaPorDiaChart
   - Modo: data=mockData
   - Uso: Section 3 (Solution Grid - card 4)

5. **MascotWidget** (`components/mascot-widget.tsx`)
   - Modo: sin cambios
   - Uso: Hero section (esquina derecha)

## Componentes que Requieren Adaptación

1. **DashboardClient** → **DashboardDemo**
   - Adaptar para modo demo
   - Deshabilitar todas las acciones
   - Uso: Hero section (opcional, alternativa a calendario)

2. **ReportesClient** → **ReportesDemo**
   - Adaptar para modo demo
   - Data=mockHistorico
   - Uso: Section 3 (card 4)

---

# 4. FUNCIONALIDADES NO MOSTRAR

## Ocultar Completamente

1. **Chatbot** - No mostrar en landing pública
   - Razón: No es diferenciador principal, distrae del mensaje

2. **Mascot personalizable** - No mostrar en landing pública
   - Razón: Feature de personalización, no core value

3. **Google Calendar sync** - No destacar como feature
   - Razón: Commodity, no diferenciador

4. **Notificaciones WhatsApp** - No mostrar (feature flag no implementado)
   - Razón: No existe en producción

5. **Multi-tenancia técnica** - No mostrar detalles técnicos
   - Razón: Usuario no le importa la arquitectura

## Mostrar Solo en Contexto Específico

1. **Roles y permisos** - Solo en sección "Para estudio con equipo"
2. **Reportes avanzados** - Solo en sección "Para estudio con equipo"
3. **Prorrateo** - Solo mencionado en card "Pagos automáticos"

---

# 5. RESOLVER PROBLEMA DEL LOGIN ACTUAL

## Decisión

**Modificar `app/page.tsx` para:**

```typescript
export default async function Home() {
  const userId = await getCurrentUser()

  if (userId) {
    redirect('/dashboard')
  } else {
    // Mostrar landing pública en lugar de redirect a /login
    return <LandingPage />
  }
}
```

## Cambio en Middleware

**Modificar `middleware.ts` para:**

```typescript
// Agregar '/' a publicPaths
const publicPaths = [
  '/',
  '/api/auth/*',
  '/reservar',
  '/privacy',
  '/terms',
]
```

## Crear LandingPage Component

**Nuevo archivo: `app/landing/page.tsx`**

```typescript
export default function LandingPage() {
  return (
    <div>
      <LandingHero />
      <LandingProblem />
      <LandingSolution />
      <LandingImport />
      <LandingUseCases />
      <LandingPricing />
      <LandingCTA />
      <LandingFooter />
    </div>
  )
}
```

## Navegación Actual

**Mantener `/login` como ruta separada**
- Landing tiene link "Iniciar sesión" en nav
- CTA "Comenzar trial gratis" va a `/signup?role=profesor`

---

# 6. RECORRIDO COMPLETO DE CONVERSIÓN

## Funnel

### Paso 1: Visitante en Landing (/)
- Ve hero con calendario visual
- Lee tagline: "Gestioná todo tu estudio de pilates en un solo lugar"
- Scrollea problem statement
- Ve solution grid
- Ve importación Excel
- Ve use cases
- Ve pricing
- Clic en "Comenzar trial gratis"

### Paso 2: Selección de Rol (Modal)
- Modal: "¿Eres profesor o alumno?"
- Opciones: [Profesor] [Alumno]
- Selección → redirige a `/signup?role=profesor` o `/signup?role=alumno`

### Paso 3: Signup (/signup?role=profesor)
- Formulario: Email, Password, Nombre
- Opción: Google OAuth
- Submit → crea cuenta con rol pre-seleccionado
- Redirect a `/onboarding`

### Paso 4: Onboarding Simplificado (/onboarding)
- Ya existe, mantener
- Selección de rol (ya pre-seleccionado desde signup)
- Confirmación → redirect a `/dashboard`

### Paso 5: Dashboard Vacío (/dashboard)
- Onboarding in-product:
  - "Configurá tu horario" → link a `/configuracion`
  - "Importá tus alumnos desde Excel" → link a `/alumnos` con ExcelImport
  - "Creá tu primera clase" → link a `/calendario`
- Usuario completa al menos 1 acción

### Paso 6: Activación
- Usuario configura horario
- Usuario importa alumnos (o crea manualmente)
- Usuario crea primera clase
- Trial activado (14 días, features PRO)

### Paso 7: Conversión a Pago
- Fin de trial (14 días)
- Modal: "Tu trial terminó"
- Opciones:
  - "Continuar con Free" (limitado a 5 alumnos)
  - "Upgrade a Starter" ($28.000)
  - "Upgrade a Pro" ($48.000)
  - "Contactar para Max"

---

# 7. COMUNICACIÓN DE PLANES

## Usando Funcionalidades Reales

### Free
- "Para empezar"
- 5 alumnos
- Calendario básico
- Gestión de alumnos
- ✗ Clases recurrentes
- ✗ Pagos automáticos
- ✗ Reportes

### Starter
- "Para estudios en crecimiento"
- 20 alumnos
- ✓ Clases recurrentes
- ✓ Prorrateo automático
- ✓ Configuración de horarios
- ✗ Google Calendar
- ✗ Notificaciones email
- ✗ Reportes

### Pro
- "Para estudios establecidos"
- 50 alumnos
- ✓ Todo lo de Starter
- ✓ Google Calendar
- ✓ Notificaciones email
- ✓ Exportar a Excel
- ✓ Reportes básicos
- ✓ Lista de espera

### Max
- "Para estudios con equipo"
- 150 alumnos
- ✓ Todo lo de Pro
- ✓ Múltiples usuarios
- ✓ Roles y permisos
- ✓ Reportes avanzados
- ✓ Soporte prioritario

## Trial Banner
- "🎁 Prueba Pro gratis 14 días"
- "Accede a todas las features Pro con hasta 10 alumnos"
- "Sin tarjeta de crédito"

---

# 8. DESTACAR IMPORTACIÓN EXCEL SIN MARKETING IA

## Decisión

**Headline:** "Trae tus datos desde Excel"

**Subhead:** "Si ya tenés alumnos en Excel, importalos en segundos"

**Copy:**
- "Subí tu archivo Excel"
- "El sistema detecta automáticamente alumnos, clases y pagos"
- "Todo migrado a tu cuenta en segundos"

**NO mencionar:**
- "IA"
- "Inteligencia artificial"
- "Groq"
- "Llama"

**Sí mencionar:**
- "Importación automática"
- "Detección inteligente"
- "Migración en segundos"

## Componente

**Reutilizar ExcelImport en modo demo**
- Mostrar UI del componente
- Simular proceso de importación
- Mostrar resultados: "X alumnos importados, Y clases, Z pagos"

---

# 9. DIFERENCIA PROFESOR INDIVIDUAL VS ESTUDIO CON EQUIPO

## Presentación en 2 Columnas

### Columna 1: Para Profesor Individual

**Headline:** "Para profesor individual"

**Bullets:**
- ✓ Agenda visual
- ✓ Gestión de alumnos
- ✓ Pagos automáticos
- ✓ Reportes
- ✓ Lista de espera

**Plan recomendado:**
- "Starter ($28.000) si tenés hasta 20 alumnos"
- "Pro ($48.000) si querés Google Calendar"

### Columna 2: Para Estudio con Equipo

**Headline:** "Para estudio con equipo"

**Bullets:**
- ✓ Todo lo de Pro
- ✓ Múltiples usuarios
- ✓ Roles y permisos
- ✓ Reportes avanzados
- ✓ Soporte prioritario

**Plan recomendado:**
- "Max (contactar) para estudios con varios profesores"

## Visualización

**Cards lado a lado**
- Card izquierda: Icono profesor individual
- Card derecha: Icono edificio/equipo
- Ambas con CTA: "Ver plan"

---

# 10. CAMBIOS CONCRETOS EN NAVEGACIÓN ACTUAL

## Nav Header Público

**Nuevo componente: `components/PublicNav.tsx`**

```
[Logo Pilates Booking] [Producto] [Precios] [Contacto]        [Iniciar sesión] [Comenzar trial]
```

**Links:**
- Producto → #solution (anchor en landing)
- Precios → #pricing (anchor en landing)
- Contacto → mailto:cabreramxr@gmail.com
- Iniciar sesión → /login
- Comenzar trial → /signup?role=profesor

## Nav Header Privado (Dashboard)

**Mantener `DashboardNav` existente**
- Sin cambios
- Solo visible después de login

## Nav Header Alumno

**Mantener `AlumnoNav` existente**
- Sin cambios
- Solo visible después de login (rol ALUMNO)

## Routing

```
/ → Landing pública (nueva)
/login → Login existente
/signup → Signup existente (con pre-selección de rol)
/dashboard → Dashboard existente (requiere auth)
/alumno → Portal alumno existente (requiere auth)
/pricing → Landing pública con anchor #pricing (nueva)
/producto → Landing pública con anchor #solution (nueva)
```

---

# WIREFRAME TEXTUAL COMPLETO

```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo] [Producto] [Precios] [Contacto]        [Login] [Trial]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Gestioná todo tu estudio de pilates en un solo lugar          │
│  Agenda, alumnos, pagos y asistencia. Desde tus primeros       │
│  alumnos hasta un equipo completo.                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [Calendario visual - modo demo con datos mock]        │   │
│  │  LUN  MAR  MIÉ  JUE  VIE  SÁB  DOM                     │   │
│  │  09:00 [Juan] [María] [Disponible]                    │   │
│  │  10:00 [Pedro] [Disponible] [Disponible]               │   │
│  │  ...                                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Comenzar gratis 14 días]                                      │
│  Sin tarjeta. Cancela cuando quieras.                          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  ¿Administrar tu estudio por WhatsApp, Excel y Google Calendar? │
│                                                                 │
│  • Pierdes tiempo coordinando clases                           │
│  • No sabes quién pagó y quién no                              │
│  • Olvidas quién viene hoy                                      │
│                                                                 │
│  [Ver cómo funciona]                                            │
├─────────────────────────────────────────────────────────────────┤
│  Todo lo que necesitás                                          │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐│
│  │ Agenda      │  │ Alumnos     │  │ Pagos       │  │ Reportes ││
│  │ visual      │  │             │  │ automáticos │  │         ││
│  │ [Icono]     │  │ [Icono]     │  │ [Icono]     │  │ [Icono] ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘│
├─────────────────────────────────────────────────────────────────┤
│  Trae tus datos desde Excel                                     │
│                                                                 │
│  Si ya tenés alumnos en Excel, importalos en segundos           │
│                                                                 │
│  [Componente ExcelImport - modo demo]                           │
│  [Ver cómo funciona]                                            │
├─────────────────────────────────────────────────────────────────┤
│  Para cada tipo de estudio                                      │
│                                                                 │
│  ┌─────────────────────┐  ┌─────────────────────┐              │
│  │ Profesor Individual  │  │ Estudio con Equipo │              │
│  │                     │  │                     │              │
│  │ ✓ Agenda visual     │  │ ✓ Roles y permisos  │              │
│  │ ✓ Pagos automáticos │  │ ✓ Multi-usuario     │              │
│  │ ✓ Reportes          │  │ ✓ Reportes avanzados│              │
│  │                     │  │                     │              │
│  │ Plan: Starter/Pro    │  │ Plan: Max            │              │
│  └─────────────────────┘  └─────────────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│  [Componente PlanesClient - reutilizar existente]               │
├─────────────────────────────────────────────────────────────────┤
│  Comenzá a organizar tu estudio hoy                             │
│                                                                 │
│  Trial gratis 14 días. Sin tarjeta.                             │
│                                                                 │
│  [Comenzar trial gratis]                                         │
├─────────────────────────────────────────────────────────────────┤
│  [Logo] [Producto] [Precios] [Contacto]                          │
│  [Privacy] [Terms]                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

# ARQUITECTURA DE NAVEGACIÓN

## Estructura de Archivos

```
app/
├── page.tsx (modificado - redirige a landing si no auth)
├── landing/
│   ├── page.tsx (nuevo - landing pública)
│   ├── layout.tsx (nuevo - layout con PublicNav)
│   ├── components/
│   │   ├── LandingHero.tsx
│   │   ├── LandingProblem.tsx
│   │   ├── LandingSolution.tsx
│   │   ├── LandingImport.tsx
│   │   ├── LandingUseCases.tsx
│   │   ├── LandingPricing.tsx
│   │   ├── LandingCTA.tsx
│   │   └── LandingFooter.tsx
│   └── demo-data.ts (datos mock para componentes)
├── (auth)/
│   ├── login/page.tsx (existente)
│   └── signup/page.tsx (modificado - acepta ?role=profesor)
├── (dashboard)/
│   ├── layout.tsx (existente - requiere auth)
│   └── ... (existente)
└── alumno/
    ├── layout.tsx (existente - requiere auth)
    └── ... (existente)
```

## Routing Table

| Ruta | Componente | Auth | Rol |
|------|------------|------|-----|
| `/` | LandingPage | No | - |
| `/login` | LoginForm | No | - |
| `/signup?role=profesor` | SignupForm | No | - |
| `/signup?role=alumno` | SignupForm | No | - |
| `/dashboard` | Dashboard | Sí | PROFESOR |
| `/calendario` | Calendario | Sí | PROFESOR |
| `/alumnos` | Alumnos | Sí | PROFESOR |
| `/pagos` | Pagos | Sí | PROFESOR |
| `/reportes` | Reportes | Sí | PROFESOR |
| `/equipo` | Equipo | Sí | PROFESOR |
| `/configuracion` | Configuración | Sí | PROFESOR |
| `/planes` | Planes | Sí | PROFESOR |
| `/alumno` | AlumnoDashboard | Sí | ALUMNO |
| `/alumno/reservar` | Reservar | Sí | ALUMNO |
| `/alumno/mis-clases` | MisClases | Sí | ALUMNO |

---

# COMPONENTES REUTILIZADOS

## Directamente (Sin Modificaciones)

1. **PlanesClient** - `app/(dashboard)/planes/planes-client.tsx`
   - Uso: LandingPricing
   - Props: userPlan, inTrial, trialDaysLeft (mock para landing)

2. **ExcelImport** - `components/ExcelImport.tsx`
   - Uso: LandingImport
   - Props: demoMode=true (desactiva upload real)

3. **Charts** - `components/charts.tsx`
   - Uso: LandingSolution (card 4)
   - Props: data=mockData

## Con Adaptación Menor

1. **CalendarioClient** → **CalendarioDemo**
   - Archivo: `app/landing/components/CalendarioDemo.tsx`
   - Adaptación: props demoMode=true, data=mockData
   - Deshabilitar: todas las acciones (click, drag, etc.)

2. **MascotWidget** - `components/mascot-widget.tsx`
   - Uso: LandingHero (esquina derecha)
   - Sin modificaciones

---

# COMPONENTES NUEVOS NECESARIOS

## 1. PublicNav

**Archivo:** `components/PublicNav.tsx`

**Props:** ninguno

**Responsabilidad:**
- Logo
- Links: Producto, Precios, Contacto
- Botones: Login, Trial
- Responsive (mobile menu)

## 2. LandingHero

**Archivo:** `app/landing/components/LandingHero.tsx`

**Props:** ninguno

**Responsabilidad:**
- Tagline
- Subtagline
- CalendarioDemo
- CTA principal
- Sub-CTA
- MascotWidget (opcional)

## 3. LandingProblem

**Archivo:** `app/landing/components/LandingProblem.tsx`

**Props:** ninguno

**Responsabilidad:**
- Headline
- 3 bullets de pain points
- CTA secundario

## 4. LandingSolution

**Archivo:** `app/landing/components/LandingSolution.tsx`

**Props:** ninguno

**Responsabilidad:**
- Headline
- 4 cards con iconos
- Charts en card 4

## 5. LandingImport

**Archivo:** `app/landing/components/LandingImport.tsx`

**Props:** ninguno

**Responsabilidad:**
- Headline
- Subhead
- ExcelImport (modo demo)
- CTA

## 6. LandingUseCases

**Archivo:** `app/landing/components/LandingUseCases.tsx`

**Props:** ninguno

**Responsabilidad:**
- Headline
- 2 columnas (profesor individual vs estudio con equipo)
- Planes recomendados

## 7. LandingPricing

**Archivo:** `app/landing/components/LandingPricing.tsx`

**Props:** ninguno

**Responsabilidad:**
- Headline
- PlanesClient (reutilizado)
- FAQ

## 8. LandingCTA

**Archivo:** `app/landing/components/LandingCTA.tsx`

**Props:** ninguno

**Responsabilidad:**
- Headline
- Subhead
- CTA final

## 9. LandingFooter

**Archivo:** `app/landing/components/LandingFooter.tsx`

**Props:** ninguno

**Responsabilidad:**
- Logo
- Links
- Legal

## 10. CalendarioDemo

**Archivo:** `app/landing/components/CalendarioDemo.tsx`

**Props:** demoMode: boolean, data: mockData

**Responsabilidad:**
- Wrapper de CalendarioClient
- Deshabilita todas las acciones
- Muestra tooltip "Demo mode"

## 11. ModalRolSeleccion

**Archivo:** `components/ModalRolSeleccion.tsx`

**Props:** onProfesor: () => void, onAlumno: () => void

**Responsabilidad:**
- Modal con 2 botones
- "Soy profesor" → onProfesor
- "Soy alumno" → onAlumno

---

# FLUJO DE CONVERSIÓN FINAL

## Diagrama de Estados

```
Visitante anónimo
    ↓
Landing (/)
    ↓
[Click CTA "Comenzar trial gratis"]
    ↓
ModalRolSeleccion
    ↓
[Selecciona "Profesor"]
    ↓
Signup (/signup?role=profesor)
    ↓
[Completa formulario]
    ↓
Cuenta creada (rol=PROFESOR)
    ↓
Onboarding (/onboarding)
    ↓
[Confirma rol]
    ↓
Dashboard (/dashboard)
    ↓
Onboarding in-product
    ↓
[Configura horario] → [Importa alumnos] → [Crea clase]
    ↓
Trial activado (14 días, features PRO)
    ↓
[Fin de trial - 14 días]
    ↓
ModalUpgrade
    ↓
[Selecciona plan] → [Upgrade] o [Continuar Free]
```

## Estados de Usuario

1. **Anónimo** - En landing
2. **Pre-signup** - En modal de rol
3. **Signup** - En formulario de registro
4. **Onboarding** - En /onboarding
5. **Dashboard vacío** - Primer acceso
6. **Activación** - Completando onboarding in-product
7. **Trial activo** - Usando producto
8. **Trial expirado** - Modal de upgrade
9. **Cliente pagando** - Plan activo

---

# ORDEN EXACTO DE IMPLEMENTACIÓN PRIORIZADO

## Fase 1: Infraestructura Mínima (Semana 1)

1. **Modificar `app/page.tsx`**
   - Agregar lógica para mostrar LandingPage si no auth
   - Mantener redirect a /dashboard si auth

2. **Modificar `middleware.ts`**
   - Agregar `/` a publicPaths

3. **Crear `app/landing/page.tsx`**
   - Componente placeholder con secciones básicas
   - Layout con PublicNav

4. **Crear `components/PublicNav.tsx`**
   - Logo, links, botones
   - Responsive

## Fase 2: Hero Section (Semana 1-2)

5. **Crear `CalendarioDemo.tsx`**
   - Wrapper de CalendarioClient
   - Props demoMode=true
   - Datos mock

6. **Crear `LandingHero.tsx`**
   - Tagline, subtagline
   - CalendarioDemo
   - CTA

7. **Crear `demo-data.ts`**
   - Datos mock para calendario
   - Datos mock para charts

## Fase 3: Secciones de Landing (Semana 2-3)

8. **Crear `LandingProblem.tsx`**
   - Pain points
   - CTA

9. **Crear `LandingSolution.tsx`**
   - 4 cards
   - Charts

10. **Crear `LandingImport.tsx`**
    - ExcelImport modo demo
    - Copy sin "IA"

11. **Crear `LandingUseCases.tsx`**
    - 2 columnas
    - Planes recomendados

12. **Crear `LandingPricing.tsx`**
    - Reutilizar PlanesClient
    - FAQ

13. **Crear `LandingCTA.tsx`**
    - CTA final

14. **Crear `LandingFooter.tsx`**
    - Logo, links, legal

## Fase 4: Mejoras de Conversión (Semana 3-4)

15. **Modificar `app/(auth)/login/login-form.tsx`**
    - Agregar link "¿No tenés cuenta? Registrate"
    - Redirige a /signup

16. **Crear `/signup` (nueva ruta)**
    - Formulario de signup
    - Acepta ?role=profesor o ?role=alumno
    - Llama a /api/auth/signup con rol

17. **Crear `ModalRolSeleccion.tsx`**
    - Modal en landing CTA
    - Redirige a /signup?role=X

18. **Modificar `/onboarding`**
    - Pre-seleccionar rol desde signup
    - Saltar selección si ya viene pre-seleccionado

## Fase 5: Onboarding In-Product (Semana 4-5)

19. **Crear onboarding in-product en `/dashboard`**
    - "Configurá tu horario" → /configuracion
    - "Importá tus alumnos" → /alumnos
    - "Creá tu primera clase" → /calendario
    - Checklist de completación

20. **Crear `ModalUpgrade.tsx`**
    - Modal al fin de trial
    - Opciones de upgrade

## Fase 6: Optimización (Semana 5-6)

21. **Performance optimization**
    - Lazy loading de componentes
    - Optimización de imágenes
    - Code splitting

22. **SEO**
    - Meta tags
    - Open Graph
    - Sitemap

23. **Analytics**
    - Tracking de funnel
    - Eventos de conversión

24. **Testing**
    - Pruebas E2E
    - Pruebas de responsive
    - Pruebas de cross-browser

---

# RIESGOS TÉCNICOS DETECTADOS EN REPOSITORIO

## Riesgo 1: CalendarioClient Complejo

**Problema:** CalendarioClient tiene 941 líneas con mucha lógica de estado

**Impacto:** Adaptar a modo demo puede ser complejo

**Mitigación:**
- Crear wrapper CalendarioDemo que pase props demoMode
- En CalendarioClient, agregar early return si demoMode=true
- Deshabilitar todos los event handlers en modo demo

## Riesgo 2: ExcelImport Requiere Backend

**Problema:** ExcelImport llama a `/api/import/excel` que requiere auth

**Impacto:** No puede funcionar en modo demo sin modificar API

**Mitigación:**
- En ExcelImport, agregar prop demoMode
- Si demoMode=true, simular proceso sin llamar API
- Mostrar resultados mockeados

## Riesgo 3: PlanesClient Requiere Auth

**Problema:** PlanesClient llama a API para obtener userPlan

**Impacto:** No puede funcionar en landing sin auth

**Mitigación:**
- En PlanesClient, agregar prop isPublic
- Si isPublic=true, usar userPlan='FREE' (mock)
- Ocultar botones de upgrade en modo público

## Riesgo 4: Middleware Actual Redirige Todo a Login

**Problema:** Middleware actual redirige `/` a `/login` si no auth

**Impacto:** Landing no será accesible

**Mitigación:**
- Modificar middleware para permitir `/` como público
- Mantener redirección para rutas protegidas

## Riesgo 5: No Existe /signup Actual

**Problema:** Solo existe /login, no /signup separado

**Impacto:** Necesario crear nueva ruta y lógica

**Mitigación:**
- Crear `/signup` reutilizando lógica de login-form
- Agregar parámetro ?role para pre-selección
- Llamar a /api/auth/signup con rol

## Riesgo 6: Onboarding Actual Post-Registro

**Problema:** Onboarding actual requiere selección de rol después de crear cuenta

**Impacto:** Añade fricción al funnel

**Mitigación:**
- Pre-seleccionar rol desde signup
- En onboarding, saltar selección si ya viene pre-seleccionado
- Redirect directo a dashboard

## Riesgo 7: Charts Requieren Data

**Problema:** Charts requieren data histórica real

**Impacto:** No pueden funcionar en landing sin data

**Mitigación:**
- Crear datos mock en demo-data.ts
- Pasar data mock a charts en modo demo
- Asegurar que charts funcionen con data estática

## Riesgo 8: MascotWidget Requiere Config

**Problema:** MascotWidget lee configuración de usuario

**Impacto:** No puede funcionar sin usuario

**Mitigación:**
- En MascotWidget, agregar prop isPublic
- Si isPublic=true, usar configuración default
- Mostrar mascot genérica en landing

## Riesgo 9: Responsive de Calendario

**Problema:** Calendario actual puede no ser responsive en mobile

**Impacto:** Landing no funcionará bien en mobile

**Mitigación:**
- Testear calendario en mobile
- Ajustar CSS si es necesario
- Considerar versión simplificada para mobile

## Riesgo 10: Performance de Landing

**Problema:** Landing con muchos componentes puede ser lenta

**Impacto:** Mala UX, baja conversión

**Mitigación:**
- Lazy loading de componentes pesados
- Optimización de imágenes
- Code splitting por sección

---

# RECOMENDACIÓN FINAL ÚNICA

## Decisión

**Implementar landing pública en `/` reutilizando componentes existentes (CalendarioClient, PlanesClient, ExcelImport) en modo demo, con pre-selección de rol en signup y onboarding in-product en dashboard.**

## Justificación

1. **Reutiliza componentes existentes** - No duplicación de código
2. **Mantiene single URL** - No dos productos distintos
3. **Modo demo sin backend** - No requiere infraestructura adicional
4. **Pre-selección de rol** - Reduce fricción de onboarding
5. **Onboarding in-product** - Mejora activación
6. **Posicionamiento claro** - "Gestioná todo en un solo lugar"
7. **Sin marketing de IA** - Importación Excel presentada como feature práctica
8. **Diferenciación clara** - Profesor individual vs estudio con equipo
9. **Implementación priorizada** - 6 semanas, fases claras
10. **Riesgos mitigados** - Cada riesgo tiene solución específica

## Impacto Esperado

- **Conversión:** +40-60% (landing clara + pre-selección de rol)
- **Time to value:** 5 min → 30 seg (landing demo)
- **Trial activation:** +25% (onboarding simplificado)
- **Upgrade rate:** +15% (onboarding in-product + upgrade modal)

## Próximo Paso Inmediato

**Modificar `app/page.tsx` y `middleware.ts` para permitir `/` como público y crear estructura básica de landing.**
