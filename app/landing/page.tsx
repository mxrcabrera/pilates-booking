import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { LandingCalendarPreview } from '@/components/LandingCalendarPreview'
import { LandingStudentsPreview } from '@/components/LandingStudentsPreview'
import { LandingPaymentsPreview } from '@/components/LandingPaymentsPreview'

export default function LandingPage() {
  return (
    <div className="page-container">
      {/* Hero Section */}
      <div className="page-header centered">
        <div>
          <h1>Organizá tu estudio de pilates sin WhatsApp ni Excel</h1>
          <p className="page-subtitle">Agenda clases, alumnos y pagos. Gratis y sin tarjeta.</p>
        </div>
        <div className="page-header-actions">
          <Link href="/signup?role=profesor">
            <Button size="lg">Empezar gratis</Button>
          </Link>
        </div>
      </div>

      {/* Badge */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          display: 'inline-block',
          padding: '0.5rem 1rem',
          background: 'rgba(110, 125, 245, 0.2)',
          border: '1px solid rgba(110, 125, 245, 0.3)',
          borderRadius: '2rem',
          fontFamily: 'var(--font-body)',
          fontSize: '0.875rem',
          color: 'rgb(110 125 245)'
        }}>
          Probá las funciones Pro durante 14 días
        </div>
      </div>

      {/* Vista del producto */}
      <div className="content-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 400, marginBottom: '1.5rem' }}>
          Así funciona el producto
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
          <LandingCalendarPreview />
          <LandingStudentsPreview />
          <LandingPaymentsPreview />
        </div>
      </div>

      {/* Plan Free */}
      <div className="content-card" style={{ maxWidth: '500px', margin: '0 auto', marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 400, marginBottom: '1.5rem', textAlign: 'center' }}>
          Plan Free
        </h2>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: 'rgb(110 125 245)', marginBottom: '0.5rem' }}>Gratis</div>
        </div>
        <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 600, color: 'rgb(110 125 245)' }}>5</div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>alumnos máximo</div>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0' }}>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', fontSize: '0.875rem', color: 'white' }}>
            <Check size={16} style={{ color: 'rgb(34 197 94)', flexShrink: 0 }} />
            <span>Agenda visual básica</span>
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', fontSize: '0.875rem', color: 'white' }}>
            <Check size={16} style={{ color: 'rgb(34 197 94)', flexShrink: 0 }} />
            <span>Gestión de alumnos</span>
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', fontSize: '0.875rem', color: 'white' }}>
            <Check size={16} style={{ color: 'rgb(34 197 94)', flexShrink: 0 }} />
            <span>Gestión de pagos</span>
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', fontSize: '0.875rem', color: 'white' }}>
            <Check size={16} style={{ color: 'rgb(34 197 94)', flexShrink: 0 }} />
            <span>Marcar asistencia</span>
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', fontSize: '0.875rem', color: 'white' }}>
            <Check size={16} style={{ color: 'rgb(34 197 94)', flexShrink: 0 }} />
            <span>Sin fecha de vencimiento</span>
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', fontSize: '0.875rem', color: 'white' }}>
            <Check size={16} style={{ color: 'rgb(34 197 94)', flexShrink: 0 }} />
            <span>Sin tarjeta de crédito</span>
          </li>
        </ul>
        <Link href="/signup?role=profesor">
          <Button size="lg" style={{ width: '100%' }}>Empezar gratis</Button>
        </Link>
      </div>

      {/* ¿Qué incluye el período de prueba? */}
      <div className="content-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 400, marginBottom: '1rem' }}>
          ¿Qué incluye el período de prueba?
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '2rem', textAlign: 'center' }}>
          Al registrarte gratis, recibís por 14 días:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 400, marginBottom: '1rem', color: 'white' }}>Durante los primeros 14 días</h3>
            <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 600, color: 'rgb(110 125 245)' }}>10</div>
              <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>alumnos máximo</div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', fontSize: '0.875rem', color: 'white' }}>
                <Check size={16} style={{ color: 'rgb(34 197 94)', flexShrink: 0 }} />
                <span>Clases recurrentes</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', fontSize: '0.875rem', color: 'white' }}>
                <Check size={16} style={{ color: 'rgb(34 197 94)', flexShrink: 0 }} />
                <span>Prorrateo automático</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', fontSize: '0.875rem', color: 'white' }}>
                <Check size={16} style={{ color: 'rgb(34 197 94)', flexShrink: 0 }} />
                <span>Configuración de horarios</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', fontSize: '0.875rem', color: 'white' }}>
                <Check size={16} style={{ color: 'rgb(34 197 94)', flexShrink: 0 }} />
                <span>Google Calendar Sync</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', fontSize: '0.875rem', color: 'white' }}>
                <Check size={16} style={{ color: 'rgb(34 197 94)', flexShrink: 0 }} />
                <span>Notificaciones por email</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', fontSize: '0.875rem', color: 'white' }}>
                <Check size={16} style={{ color: 'rgb(34 197 94)', flexShrink: 0 }} />
                <span>Exportación a Excel</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', fontSize: '0.875rem', color: 'white' }}>
                <Check size={16} style={{ color: 'rgb(34 197 94)', flexShrink: 0 }} />
                <span>Reportes básicos</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', fontSize: '0.875rem', color: 'white' }}>
                <Check size={16} style={{ color: 'rgb(34 197 94)', flexShrink: 0 }} />
                <span>Lista de espera</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 400, marginBottom: '1rem', color: 'white' }}>Después del trial</h3>
            <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 600, color: 'rgb(110 125 245)' }}>5</div>
              <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>alumnos máximo</div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', fontSize: '0.875rem', color: 'white' }}>
                <Check size={16} style={{ color: 'rgb(34 197 94)', flexShrink: 0 }} />
                <span>Agenda de clases</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', fontSize: '0.875rem', color: 'white' }}>
                <Check size={16} style={{ color: 'rgb(34 197 94)', flexShrink: 0 }} />
                <span>Gestión de alumnos</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', fontSize: '0.875rem', color: 'white' }}>
                <Check size={16} style={{ color: 'rgb(34 197 94)', flexShrink: 0 }} />
                <span>Gestión de pagos</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', fontSize: '0.875rem', color: 'white' }}>
                <Check size={16} style={{ color: 'rgb(34 197 94)', flexShrink: 0 }} />
                <span>Registro de asistencia</span>
              </li>
            </ul>
          </div>
        </div>
        <div style={{ background: 'rgba(110, 125, 245, 0.1)', border: '1px solid rgba(110, 125, 245, 0.2)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '2rem' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1.6 }}>
            Al finalizar el período de prueba continuás automáticamente con el plan Free. No perdés tus datos.
          </p>
        </div>
        <Link href="/signup?role=profesor">
          <Button size="lg" style={{ width: '100%' }}>Empezar gratis</Button>
        </Link>
      </div>

      {/* FAQ */}
      <div className="content-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 400, marginBottom: '1.5rem' }}>
          Preguntas frecuentes
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(120, 140, 220, 0.18)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 400, marginBottom: '0.75rem', color: 'white' }}>¿Es realmente gratis el plan Free?</h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1.6 }}>
              Sí, el plan Free es gratuito. No necesitás tarjeta de crédito. Tiene un límite de 5 alumnos y funcionalidades básicas.
            </p>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(120, 140, 220, 0.18)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 400, marginBottom: '0.75rem', color: 'white' }}>¿Qué pasa después de los 14 días de Pro?</h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1.6 }}>
              Continuás automáticamente en el plan Free. El límite de alumnos pasa de 10 a 5 y se deshabilitan las funcionalidades avanzadas. No perdés tus datos.
            </p>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(120, 140, 220, 0.18)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 400, marginBottom: '0.75rem', color: 'white' }}>¿Necesito tarjeta de crédito?</h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1.6 }}>
              No. El plan Free no requiere tarjeta.
            </p>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(120, 140, 220, 0.18)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 400, marginBottom: '0.75rem', color: 'white' }}>¿Puedo exportar mis datos si quiero irme?</h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1.6 }}>
              Sí. Podés exportar tus alumnos y clases a Excel en cualquier momento (feature de Pro).
            </p>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(120, 140, 220, 0.18)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 400, marginBottom: '0.75rem', color: 'white' }}>¿Cómo funcionan los horarios?</h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1.6 }}>
              La configuración de horarios es una funcionalidad de Starter y Pro. Durante el trial de 14 días podés definir tus horarios de mañana y tarde según tu disponibilidad.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Final */}
      <div className="content-card" style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 400, marginBottom: '1rem' }}>
          Empezá a organizar tu estudio hoy
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '2rem' }}>
          Plan Free. 14 días de Pro gratis. Sin compromiso.
        </p>
        <Link href="/signup?role=profesor">
          <Button size="lg">Empezar gratis</Button>
        </Link>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(120, 140, 220, 0.18)', padding: '3rem 0', marginTop: '3rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 400 }}>
            Pilates Booking
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="/privacy" style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none' }}>
              Privacy
            </a>
            <a href="/terms" style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none' }}>
              Terms
            </a>
            <a href="mailto:cabreramxr@gmail.com" style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)', textDecoration: 'none' }}>
              Contacto
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
