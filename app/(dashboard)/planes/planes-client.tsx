'use client'

import { useState } from 'react'
import { Check, Crown, Zap, Building2, Sparkles, Clock, Mail, ChevronDown } from 'lucide-react'
import { PLAN_CONFIGS } from '@/lib/plans'
import type { PlanType } from '@prisma/client'

type Props = {
  userPlan: PlanType
  inTrial: boolean
  trialDaysLeft: number
}

const PLAN_ICONS: Record<PlanType, React.ReactNode> = {
  FREE: <Sparkles size={24} />,
  STARTER: <Zap size={24} />,
  PRO: <Crown size={24} />,
  ESTUDIO: <Building2 size={24} />
}

const PLAN_ORDER: PlanType[] = ['FREE', 'STARTER', 'PRO', 'ESTUDIO']

// Features para mostrar en comparativa (todas)
const COMPARISON_FEATURES: (keyof typeof PLAN_CONFIGS.FREE.features)[] = [
  'clasesRecurrentes',
  'prorrateoAutomatico',
  'portalAlumnos',
  'configuracionHorarios',
  'googleCalendarSync',
  'notificacionesEmail',
  'exportarExcel',
  'reportesBasicos',
  'listaEspera',
  'notificacionesWhatsApp',
  'multiplesUsuarios',
  'rolesPermisos',
  'reportesAvanzados',
  'soportePrioritario',
  'onboardingAsistido'
]

const FEATURE_LABELS: Record<string, string> = {
  maxAlumnos: 'Máximo de alumnos',
  clasesRecurrentes: 'Clases recurrentes',
  prorrateoAutomatico: 'Prorrateo automático',
  portalAlumnos: 'Portal de alumnos',
  configuracionHorarios: 'Configuración de horarios',
  googleCalendarSync: 'Google Calendar',
  notificacionesEmail: 'Notificaciones email',
  exportarExcel: 'Exportar a Excel',
  reportesBasicos: 'Reportes básicos',
  listaEspera: 'Lista de espera',
  notificacionesWhatsApp: 'WhatsApp',
  multiplesUsuarios: 'Múltiples usuarios',
  rolesPermisos: 'Roles y permisos',
  reportesAvanzados: 'Reportes avanzados',
  soportePrioritario: 'Soporte prioritario',
  onboardingAsistido: 'Onboarding asistido'
}

function formatPrice(price: number): string {
  if (price === 0) return 'Gratis'
  if (price === -1) return 'A convenir'
  return `$${price.toLocaleString('es-AR')}`
}

export function PlanesClient({ userPlan, inTrial, trialDaysLeft }: Props) {
  const [showComparison, setShowComparison] = useState(false)

  const getCardState = (planKey: PlanType) => {
    if (inTrial) {
      if (planKey === 'PRO') return 'trial-access'
      if (planKey === 'FREE') return 'base-plan'
      return 'available'
    }
    if (userPlan === planKey) return 'current'
    return 'available'
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        <div>
          <h1>Planes</h1>
          <p className="page-subtitle">Elegí el plan que mejor se adapte a tu espacio</p>
        </div>
      </div>

      {/* Mobile: Cards compactas sin accordion */}
      <div className="pricing-mobile">
        {/* Banner de trial */}
        {inTrial && (
          <div className="pricing-trial-banner">
            <div className="pricing-trial-banner-content">
              <span className="pricing-trial-banner-status">Probando <strong>Pro</strong></span>
              <span className="pricing-trial-banner-days">{trialDaysLeft} días restantes</span>
            </div>
            <div className="pricing-trial-banner-info">
              Después del trial pasás automáticamente al plan Free
            </div>
          </div>
        )}

        <div className="pricing-cards-compact">
          {PLAN_ORDER.map(planKey => {
            const config = PLAN_CONFIGS[planKey]
            const state = getCardState(planKey)

            return (
              <div
                key={planKey}
                className={`pricing-card-compact ${state} ${planKey === 'PRO' ? 'featured' : ''}`}
              >
                <div className="pricing-card-left">
                  <div className="pricing-card-title">
                    <span>{config.name}</span>
                    {state === 'current' && (
                      <span className="pricing-badge-inline current">
                        Actual
                      </span>
                    )}
                  </div>
                  <div className="pricing-card-limit">
                    {config.features.maxAlumnos} alumnos
                  </div>
                </div>
                <div className="pricing-card-right">
                  <div className="pricing-card-price">
                    {formatPrice(config.price)}
                    {config.price > 0 && <span className="pricing-card-period">/mes</span>}
                  </div>
                  {(state === 'available' || state === 'trial-access') && config.price !== -1 && (
                    <button className="pricing-card-cta">Contratar</button>
                  )}
                  {(state === 'available' || state === 'trial-access') && config.price === -1 && (
                    <a
                      href="mailto:cabreramxr@gmail.com?subject=Consulta%20Plan%20Max"
                      className="pricing-card-cta"
                    >
                      Consultar
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Botón para ver comparativa */}
        <button
          className="pricing-compare-toggle"
          onClick={() => setShowComparison(!showComparison)}
        >
          <span>{showComparison ? 'Ocultar' : 'Comparar'} funciones</span>
          <ChevronDown
            size={16}
            style={{ transform: showComparison ? 'rotate(180deg)' : 'none' }}
          />
        </button>

        {/* Tabla comparativa */}
        {showComparison && (
          <div className="pricing-comparison">
            <div className="pricing-comparison-header">
              <div className="pricing-comparison-feature"></div>
              {PLAN_ORDER.map(planKey => (
                <div key={planKey} className="pricing-comparison-plan">
                  {PLAN_CONFIGS[planKey].name}
                </div>
              ))}
            </div>

            <div className="pricing-comparison-row highlight">
              <div className="pricing-comparison-feature">Alumnos</div>
              {PLAN_ORDER.map(planKey => (
                <div key={planKey} className="pricing-comparison-value">
                  {PLAN_CONFIGS[planKey].features.maxAlumnos}
                </div>
              ))}
            </div>

            {COMPARISON_FEATURES.map(feature => (
              <div key={feature} className="pricing-comparison-row">
                <div className="pricing-comparison-feature">
                  {FEATURE_LABELS[feature]}
                </div>
                {PLAN_ORDER.map(planKey => {
                  const hasFeature = PLAN_CONFIGS[planKey].features[feature]
                  return (
                    <div key={planKey} className="pricing-comparison-value">
                      {hasFeature ? (
                        <Check size={14} className="check" />
                      ) : (
                        <span className="no">—</span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: Grid de 4 columnas */}
      <div className="pricing-grid">
        {PLAN_ORDER.map(planKey => {
          const config = PLAN_CONFIGS[planKey]
          const cardState = getCardState(planKey)

          return (
            <div
              key={planKey}
              className={`pricing-card ${planKey === 'PRO' ? 'featured' : ''} ${cardState}`}
            >
              {planKey === 'PRO' && !inTrial && (
                <div className="pricing-badge">Más popular</div>
              )}

              {cardState === 'trial-access' && (
                <div className="pricing-badge trial">Probando ahora</div>
              )}

              <div className="pricing-header">
                <div className="pricing-icon">
                  {PLAN_ICONS[planKey]}
                </div>
                <h2 className="pricing-name">{config.name}</h2>
                <div className="pricing-price">
                  {formatPrice(config.price)}{config.price > 0 && <span className="pricing-period">/mes</span>}
                </div>
              </div>

              <div className="pricing-features">
                <div className="pricing-feature highlight">
                  <span className="feature-value">{config.features.maxAlumnos}</span>
                  <span className="feature-label">alumnos máximo</span>
                </div>

                <ul className="feature-list">
                  {Object.entries(config.features).map(([key, value]) => {
                    if (key === 'maxAlumnos') return null
                    if (typeof value !== 'boolean') return null

                    return (
                      <li key={key} className={`feature-item ${value ? 'included' : 'not-included'}`}>
                        {value ? (
                          <Check size={16} className="feature-check" />
                        ) : (
                          <span className="feature-x-icon" />
                        )}
                        <span>{FEATURE_LABELS[key] || key}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>

              <div className="pricing-action">
                {cardState === 'current' ? (
                  <button className="btn-current-plan">
                    <Check size={16} />
                    <span>Tu plan actual</span>
                  </button>
                ) : cardState === 'trial-access' ? (
                  <button className="btn-trial-access">
                    <Clock size={16} />
                    <span>Probando por {trialDaysLeft} días</span>
                  </button>
                ) : cardState === 'base-plan' ? (
                  <div className="base-plan-info">
                    <span>Tu plan base después del trial</span>
                  </div>
                ) : config.price === -1 ? (
                  <a
                    href="mailto:cabreramxr@gmail.com?subject=Consulta%20Plan%20Max"
                    className="btn-primary"
                  >
                    Consultar
                  </a>
                ) : (
                  <button className="btn-primary">
                    Elegir plan
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="pricing-faq">
        <h3>Preguntas frecuentes</h3>
        <div className="faq-grid">
          <div className="faq-item">
            <h4>¿Puedo cambiar de plan en cualquier momento?</h4>
            <p>Sí, podés actualizar o bajar tu plan cuando quieras. Los cambios se aplican inmediatamente.</p>
          </div>
          <div className="faq-item">
            <h4>¿Qué pasa si supero el límite de alumnos?</h4>
            <p>No podrás agregar nuevos alumnos hasta que actualices tu plan o elimines alumnos existentes.</p>
          </div>
          <div className="faq-item">
            <h4>¿Cómo funciona el período de prueba?</h4>
            <p>Tenés 14 días para probar todas las funcionalidades del plan Pro con hasta 10 alumnos. Después del trial, tu cuenta pasa al plan Free automáticamente.</p>
          </div>
          <div className="faq-item">
            <h4>¿Qué métodos de pago aceptan?</h4>
            <p>Aceptamos tarjetas de crédito/débito y transferencia bancaria.</p>
          </div>
        </div>

        <div className="faq-cta">
          <p className="faq-cta-text">¿Tenés más preguntas?</p>
          <a href="mailto:cabreramxr@gmail.com">
            <Mail size={16} />
            Escribinos
          </a>
        </div>
      </div>
    </div>
  )
}
