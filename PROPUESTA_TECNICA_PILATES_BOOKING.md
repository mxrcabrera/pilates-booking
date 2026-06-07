PROPUESTA DE INGENIERÍA Y AUTOMATIZACIÓN: SISTEMA PILATES BOOKING
CLIENTE: [NOMBRE DEL CLIENTE]
DOMICILIO: [DIRECCIÓN]
PROYECTO: Automatización Pragmática de Plataforma de Gestión de Pilates
AUTORA: Marianella Cabrera Ahumada
FECHA: Junio 2026

---

1. PROPÓSITO DEL PROYECTO

El objetivo es agregar 6 funcionalidades pragmáticas a la plataforma Pilates Booking existente que reduzcan la carga administrativa de instructores y estudios de Pilates. El sistema actual es funcional para operación diaria, pero le falta automatización en áreas críticas que generan carga mental y física.

La filosofía: simple, a prueba de brutos, para el cliente que no tiene tiempo ni ganas de configurar/divagar por el sistema. Solucionar problemas reales, no crear nuevos.

---

2. ARQUITECTURA TÉCNICA ACTUAL (EL RESPALDO)

La plataforma actual utiliza tecnologías modernas que garantizan estabilidad y escalabilidad:

● Framework: Next.js 16 (App Router, Turbopack)
● Frontend: React 19, Tailwind CSS 4
● Base de Datos: PostgreSQL (Supabase)
● ORM: Prisma 6
● Autenticación: NextAuth v5 (Google OAuth + Credentials/JWT)
● Validación: Zod
● Email: Resend
● Hosting: Vercel

**Modelos de Datos Actuales:**
- User (Profesor/Alumno)
- Alumno (Datos del alumno, pack, estado)
- Clase (Scheduling, asistencia, recurrentes)
- Pago (Facturación mensual, estado)
- Pack (Configuración de packs)
- HorarioDisponible (Slots de disponibilidad)
- Estudio (Multi-tenancia con roles)
- Notificacion (In-app y email)
- ListaEspera (Gestión de cupos)
- FechaBloqueada (Feriados/bloqueos)

---

3. MÓDULOS OPERATIVOS ACTUALES

**Portal de Profesores:**
- Gestión de alumnos (CRUD, packs, estado)
- Calendario y scheduling (vista semanal, clases recurrentes)
- Configuración de horarios (mañana/tarde, cupos)
- Gestión de pagos (facturación mensual, seguimiento)
- Marcado de asistencia
- Reportes básicos
- Google Calendar sync (Pro+)

**Portal de Alumnos:**
- Reserva de clases online
- Lista de espera automática
- Vista de mis clases
- Configuración de perfil
- Setup Wizard inicial

**Nota sobre UX/UI:**
El portal de alumnas reutiliza los mismos estilos y componentes del portal de profes (clases compartidas como .dashboard-container, .dashboard-header, .dashboard-nav, etc.). Esto asegura consistencia visual y reduce mantenimiento.

**Multi-tenancia:**
- Roles: Owner, Admin, Instructor, Viewer
- Configuración por estudio

---

4. PROPUESTA DE AUTOMATIZACIÓN (9 FUNCIONALIDADES PRAGMÁTICAS)

**Nota:** Las funcionalidades 1-6 son compartidas entre ambos portales (profes y alumnos). Las funcionalidades 7-9 son específicas del portal de alumnos.

4.1. Chatbot IA con Ollama (DENTRO DE LA APP)

**Qué es:**
Un chatbot integrado en la app que responde preguntas automáticamente 24/7, usando Ollama (gratis, corre local).

**Funcionalidades:**
- Preguntas frecuentes: horarios, precios, política de cancelación
- Asistente de reservas: búsqueda de slots, sugerencia de horarios
- Recordatorios de pagos: avisa de forma "humana" entendiendo el contexto
- Generación de links de pago: conectado con Mercado Pago
- Aviso a lista de espera: cuando se libera un lugar

**Por qué es necesario:**
- Las profes no tienen tiempo ni ganas de responder mensajes 24/7
- Saca carga mental y física
- El chatbot tiene acceso al historial de cada alumna y entiende cambios constantes
- Gratis (Ollama corre local, sin APIs externas)

**Costo:** Gratis (Ollama es open-source y corre local)

---

4.2. Cobro Automático con Mercado Pago

**Qué es:**
Integración con Mercado Pago para que las alumnas puedan pagar con tarjeta automáticamente. El sistema genera el link de pago y el chatbot lo manda.

**Funcionalidades:**
- Links de pago automáticos
- Webhooks para confirmación de pagos
- Conectado con el chatbot para enviar links
- Soporte para cualquier tarjeta argentina

**Costo:**
- Gratis para vos (Mercado Pago cobra comisión al alumno: ~3-5%)
- No hay opción de cobro sin comisión (todas las pasarelas cobran)

**Por qué Mercado Pago:**
- Es lo más usado en Argentina
- Las alumnas ya lo conocen
- Fácil de integrar

---

4.3. Facturación con Arca (CON CONFIRMACIÓN)

**Qué es:**
Integración con Arca (plataforma de AFIP) para generar facturas electrónicas, pero SIEMPRE con confirmación de las profes antes de enviar.

**Flujo:**
1. La app tiene un botón "Generar factura"
2. Antes de enviar a Arca, le pregunta a la pro: "¿Querés facturar este pago a María por $X?"
3. La pro confirma → se envía a Arca
4. Siempre queda registro en la app antes de Arca

**Por qué es necesario:**
- Las profes necesitan facturar para AFIP
- Arca es la plataforma oficial
- Flujo simple con confirmación evita errores

---

4.4. Recordatorios de Pagos con Chatbot (NO SPAM)

**Qué es:**
El chatbot avisa de pagos vencidos de forma "humana", entendiendo el contexto y el historial de cada alumna.

**Funcionalidades:**
- Aviso "humano": "Hola María, vi que todavía no pagaste el mes. ¿Todo bien? Si necesitás más tiempo avísame"
- Conectado con el historial de la alumna
- Entiende cambios constantes
- No spam (solo avisa cuando es necesario)

**Por qué es necesario:**
- Evita que las alumnas desinstalen la app por spam
- El chatbot responde como lo haría una pro
- Reduce carga mental de las profes

---

4.5. Reprogramación con Lista de Espera

**Qué es:**
Cuando alguien cancela una clase, el chatbot avisa automáticamente a los alumnos que están en lista de espera de forma "humana".

**Funcionalidades:**
- Aviso a lista de espera: "Hola Ana, se liberó un lugar el lunes a las 10. ¿Te interesa?"
- Simple, sin configuración
- Usa la lista de espera existente en el sistema

**Por qué es necesario:**
- Ya existe el sistema de lista de espera en el repo
- Solo falta conectar con el chatbot
- Simple, a prueba de brutos

---

4.6. Reportes Configurables con Chatbot

**Qué es:**
Las profes le piden al chatbot cualquier reporte que necesiten, y Ollama lo genera. Flexible para cualquier cosa (sorteos, estadísticas, etc.).

**Ejemplo de uso:**
Las profes quieren un reporte del sorteo de stickers. Le preguntan al chatbot: "Dame un reporte de quiénes participaron en el sorteo de stickers". El chatbot genera el reporte.

**Funcionalidades:**
- Flexible para cualquier tipo de reporte
- Ollama genera reportes a pedido
- No requiere configuración previa
- Sirve para sorteos, estadísticas, cualquier cosa

**Por qué es necesario:**
- Las profes necesitan reportes ad-hoc (sorteos, promociones, etc.)
- No es over-engineering, es flexible
- Ollama es gratis y corre local

---

4.7. Pagos desde el Portal de Alumnos (MERCADO PAGO)

**Qué es:**
El alumno puede pagar directamente desde el portal de alumnos. El chatbot genera el link de pago de Mercado Pago y se lo manda.

**Funcionalidades:**
- Botón "Pagar" en el portal de alumnos
- Link de pago generado automáticamente
- Conectado con el chatbot para asistencia
- Historial de pagos visible para el alumno

**Por qué es necesario:**
- El alumno puede pagar sin tener que ir a otro lado
- Simple, a prueba de brutos
- Reutiliza la integración de Mercado Pago (funcionalidad 4.2)

---

4.8. Lista de Espera Visible

**Qué es:**
El alumno puede ver su posición en la lista de espera. Si está en lista de espera, sabe cuándo le toca.

**Funcionalidades:**
- Vista de lista de espera en "Mis Clases"
- Posición del alumno en la lista
- Notificación cuando se libera un lugar (chatbot)
- Simple, sin configuración

**Por qué es necesario:**
- El alumno sabe su posición sin tener que preguntar
- Ya existe el sistema de lista de espera en el backend
- Solo falta mostrarlo en el frontend

---

4.9. Recordatorios de Clases (CHATBOT)

**Qué es:**
El chatbot avisa al alumno 24h antes de su clase de forma "humana".

**Funcionalidades:**
- Aviso 24h antes: "Hola María, mañana tenés clase a las 10. ¿Te esperamos?"
- Conectado con el historial del alumno
- No spam (solo avisa cuando es necesario)
- Reutiliza el chatbot (funcionalidad 4.1)

**Por qué es necesario:**
- El alumno no tiene que recordar sus clases
- El chatbot responde como lo haría una pro
- Reduce carga mental del alumno

---

5. CRONOGRAMA DE IMPLEMENTACIÓN (5 SEMANAS)

**Semana 1: Chatbot IA con Ollama**
- Configuración de Ollama
- Integración en la app (ambos portales)
- Preguntas frecuentes
- Asistente de reservas
- Testing

**Semana 2: Cobro Automático con Mercado Pago**
- Integración Mercado Pago
- Generación de links de pago
- Webhooks y confirmación
- Conexión con chatbot
- Pagos desde portal de alumnos
- Testing con pagos reales

**Semana 3: Facturación con Arca + Recordatorios de Pagos**
- Integración Arca
- Flujo con confirmación de profes
- Recordatorios de pagos con chatbot
- Testing

**Semana 4: Reprogramación + Lista de Espera + Recordatorios de Clases**
- Conexión chatbot con lista de espera
- Lista de espera visible para alumnos
- Recordatorios de clases con chatbot
- Testing

**Semana 5: Reportes Configurables + Testing Final**
- Reportes configurables con Ollama
- Testing end-to-end
- Lanzamiento

---

6. MARCO DE TRABAJO Y PROPIEDAD INTELECTUAL

Para que ambos trabajemos tranquilos y con las reglas claras, establecemos los siguientes puntos de confianza:

● Autoría de la Solución: Esta propuesta técnica es un diseño original de Marianella Cabrera Ahumada. Al contratar el servicio, el Cliente accede a una licencia de uso exclusivo y permanente.

● Confidencialidad: El contenido de este plan de trabajo es privado y para uso interno del Cliente.

● Validez: Esta propuesta mantiene sus condiciones por un plazo de 30 días.

---

7. GARANTÍAS Y RESPONSABILIDADES

● Uso de Datos: El sistema cumple con las normativas de protección de datos. El Cliente es responsable del manejo de la base de datos de sus alumnos.

● Continuidad del Servicio: No me hago responsable por fallas ajenas al software (cortes de internet, caídas de Mercado Pago, etc.).

● Responsabilidad Fiscal: La emisión de facturas ante AFIP es responsabilidad exclusiva del estudio.

● Supervisión de la IA: La IA requiere supervisión humana mínima para casos excepcionales. La configuración final debe ser validada por el Cliente.

● Soporte Post-Lanzamiento: El proyecto incluye acompañamiento de 30 días tras la puesta en marcha.

---

8. PROTOCOLO DE EXCLUSIVIDAD Y SEGURIDAD

● Exclusividad de Zona: Me comprometo a no implementar esta misma arquitectura técnica en estudios de Pilates dentro del radio de 5km del domicilio del Cliente por 12 meses.

● Soberanía de Datos: Toda la base de datos es propiedad 100% del Cliente. Backups diarios automáticos.

● Prioridad de Soporte: Línea directa prioritaria de lunes a domingo.

---

9. PRÓXIMOS PASOS

1. Definición de Inversión: Acordar el presupuesto final.
   Inversión Total: $ [A DEFINIR]

2. Kick-off: Iniciar con Semana 1 (Chatbot IA con Ollama).

---

Nota Legal: Esta propuesta constituye un acuerdo de servicios profesionales. La autora se compromete a la ejecución técnica según las buenas prácticas de ingeniería de software. Ante diferencias, las partes aceptan la jurisdicción de los Tribunales de CABA.

Desarrollado por: Marianella Cabrera Ahumada

Garantía de Simplicidad: Tecnología de calidad al servicio de la enseñanza.

Confidencial - Propiedad Intelectual de Marianella Cabrera Ahumada © 2026
