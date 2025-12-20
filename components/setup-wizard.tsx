'use client'

import { useRouter } from 'next/navigation'
import { Check, ChevronRight, Settings, Users, Calendar, CreditCard } from 'lucide-react'

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
      title: 'Configurar horarios',
      description: 'Definí en qué días y horarios das clases',
      icon: <Calendar size={24} />,
      href: '/configuracion',
      completed: hasHorarios
    },
    {
      id: 'packs',
      title: 'Crear paquetes',
      description: 'Configurá los packs de clases y precios',
      icon: <CreditCard size={24} />,
      href: '/configuracion',
      completed: hasPacks
    },
    {
      id: 'alumnos',
      title: 'Agregar alumnos',
      description: 'Registrá a tus primeros alumnos',
      icon: <Users size={24} />,
      href: '/alumnos',
      completed: hasAlumnos
    }
  ]

  const completedCount = steps.filter(s => s.completed).length
  const allCompleted = completedCount === steps.length
  const currentStep = steps.find(s => !s.completed) || steps[0]

  if (allCompleted) {
    return null
  }

  return (
    <div className="setup-wizard">
      <div className="setup-wizard-header">
        <div className="setup-wizard-icon">
          <Settings size={32} />
        </div>
        <div>
          <h2>Bienvenido{userName ? `, ${userName.split(' ')[0]}` : ''}!</h2>
          <p>Completá estos pasos para empezar a usar tu estudio</p>
        </div>
      </div>

      <div className="setup-wizard-progress">
        <div className="setup-progress-bar">
          <div
            className="setup-progress-fill"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
        <span className="setup-progress-text">{completedCount} de {steps.length} completados</span>
      </div>

      <div className="setup-wizard-steps">
        {steps.map((step, index) => (
          <button
            key={step.id}
            className={`setup-step ${step.completed ? 'completed' : ''} ${step.id === currentStep.id ? 'current' : ''}`}
            onClick={() => router.push(step.href)}
          >
            <div className="setup-step-number">
              {step.completed ? (
                <Check size={16} />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <div className="setup-step-icon">
              {step.icon}
            </div>
            <div className="setup-step-content">
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
            <ChevronRight size={20} className="setup-step-arrow" />
          </button>
        ))}
      </div>
    </div>
  )
}
