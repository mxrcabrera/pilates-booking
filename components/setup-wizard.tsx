'use client'

import { useRouter } from 'next/navigation'
import { Check, ArrowRight, Clock, Package, Users, Sparkles } from 'lucide-react'

interface SetupStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  href: string
  completed: boolean
}

interface SetupWizardProps {
  hasHorarios: boolean
  hasPacks: boolean
  hasAlumnos: boolean
  userName?: string
}

export function SetupWizard({ hasHorarios, hasPacks, hasAlumnos, userName }: SetupWizardProps) {
  const router = useRouter()

  const steps: SetupStep[] = [
    {
      id: 'horarios',
      title: 'Horarios',
      description: 'Configurá tus días y horarios de clases',
      icon: <Clock size={20} />,
      href: '/configuracion',
      completed: hasHorarios
    },
    {
      id: 'packs',
      title: 'Paquetes',
      description: 'Creá tus packs y definí precios',
      icon: <Package size={20} />,
      href: '/planes',
      completed: hasPacks
    },
    {
      id: 'alumnos',
      title: 'Alumnos',
      description: 'Agregá a tus primeros alumnos',
      icon: <Users size={20} />,
      href: '/alumnos',
      completed: hasAlumnos
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
          Completá estos {steps.length - completedCount} pasos para empezar
        </p>
      </div>

      <div className="wizard-steps">
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
