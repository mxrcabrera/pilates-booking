'use client'

import { useRouter } from 'next/navigation'
import { Check, ArrowRight, User, Search, Sparkles } from 'lucide-react'

interface SetupStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  href: string
  completed: boolean
}

interface AlumnoSetupWizardProps {
  hasProfile: boolean
  hasProfesor: boolean
  userName?: string
}

export function AlumnoSetupWizard({ hasProfile, hasProfesor, userName }: AlumnoSetupWizardProps) {
  const router = useRouter()

  const steps: SetupStep[] = [
    {
      id: 'profile',
      title: 'Perfil',
      description: 'Completá tu teléfono y datos personales',
      icon: <User size={20} />,
      href: '/alumno/configuracion',
      completed: hasProfile
    },
    {
      id: 'profesor',
      title: 'Profesor',
      description: 'Buscá a tu profesor para reservar clases',
      icon: <Search size={20} />,
      href: '/alumno/reservar',
      completed: hasProfesor
    }
  ]

  const completedCount = steps.filter(s => s.completed).length
  const allCompleted = completedCount === steps.length
  const nextStep = steps.find(s => !s.completed)

  if (allCompleted) {
    return null
  }

  return (
    <div className="wizard">
      <div className="wizard-header">
        <div className="wizard-greeting">
          <Sparkles size={20} />
          <span>Hola{userName ? `, ${userName.split(' ')[0]}` : ''}!</span>
        </div>
        <p className="wizard-subtitle">
          Completá estos {steps.length - completedCount} pasos para reservar
        </p>
      </div>

      <div className="wizard-steps" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {steps.map((step, index) => {
          const isNext = step.id === nextStep?.id
          return (
            <button
              key={step.id}
              className={`wizard-step ${step.completed ? 'completed' : ''} ${isNext ? 'next' : ''}`}
              onClick={() => router.push(step.href)}
            >
              <div className="wizard-step-indicator">
                {step.completed ? (
                  <Check size={14} strokeWidth={3} />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              <div className="wizard-step-icon">
                {step.icon}
              </div>

              <div className="wizard-step-info">
                <span className="wizard-step-title">{step.title}</span>
                <span className="wizard-step-desc">{step.description}</span>
              </div>

              {!step.completed && (
                <ArrowRight size={16} className="wizard-step-arrow" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
