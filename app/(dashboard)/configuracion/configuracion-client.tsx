'use client'

import { useState, useEffect } from 'react'
import { Clock, User, Lock, Settings } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { ProfileForm } from './profile-form'
import { PasswordForm } from './password-form'
import { HorariosSection } from './horarios-section'
import { PreferenciasSection } from './preferencias-section'

type Horario = {
  id: string
  diaSemana: number
  horaInicio: string
  horaFin: string
  esManiana: boolean
  estaActivo: boolean
}

type Pack = {
  id: string
  nombre: string
  clasesPorSemana: number
  precio: string
  estaActivo: boolean
}

type Profesor = {
  id: string
  nombre: string
  email: string
  telefono: string | null
  horasAnticipacionMinima: number
  maxAlumnosPorClase: number
  horarioMananaInicio: string
  horarioMananaFin: string
  horarioTardeInicio: string
  horarioTardeFin: string
  espacioCompartidoId: string | null
  syncGoogleCalendar: boolean
  hasGoogleAccount: boolean
}

interface ConfiguracionClientProps {
  profesor: Profesor
  horarios: Horario[]
  packs: Pack[]
}

type Tab = 'horarios' | 'preferencias' | 'perfil' | 'seguridad'
type Section = 'settings' | 'account'

export function ConfiguracionClient({ profesor, horarios, packs }: ConfiguracionClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('horarios')
  const [section, setSection] = useState<Section>('settings')

  useEffect(() => {
    // Check for hash in URL to set initial tab and section
    const hash = window.location.hash.slice(1) as Tab
    if (hash && ['horarios', 'preferencias'].includes(hash)) {
      setActiveTab(hash)
      setSection('settings')
    } else if (hash && ['perfil', 'seguridad'].includes(hash)) {
      setActiveTab(hash)
      setSection('account')
    }
  }, [])

  return (
    <div className="settings-tabs">
      {/* Tabs Navigation */}
      <div className="tabs-nav">
        {section === 'settings' ? (
          <>
            <button
              onClick={() => setActiveTab('horarios')}
              className={`tab-button ${activeTab === 'horarios' ? 'active' : ''}`}
            >
              <Clock size={20} />
              <span>Horarios</span>
            </button>
            <button
              onClick={() => setActiveTab('preferencias')}
              className={`tab-button ${activeTab === 'preferencias' ? 'active' : ''}`}
            >
              <Settings size={20} />
              <span>Preferencias</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('perfil')}
              className={`tab-button ${activeTab === 'perfil' ? 'active' : ''}`}
            >
              <User size={20} />
              <span>Perfil</span>
            </button>
            <button
              onClick={() => setActiveTab('seguridad')}
              className={`tab-button ${activeTab === 'seguridad' ? 'active' : ''}`}
            >
              <Lock size={20} />
              <span>Seguridad</span>
            </button>
          </>
        )}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'horarios' && (
          <div className="tab-panel">
            <HorariosSection
              horarios={horarios}
              horarioMananaInicio={profesor.horarioMananaInicio}
              horarioMananaFin={profesor.horarioMananaFin}
              horarioTardeInicio={profesor.horarioTardeInicio}
              horarioTardeFin={profesor.horarioTardeFin}
            />
          </div>
        )}

        {activeTab === 'preferencias' && (
          <div className="tab-panel">
            <PreferenciasSection
              horasAnticipacionMinima={profesor.horasAnticipacionMinima}
              maxAlumnosPorClase={profesor.maxAlumnosPorClase}
              horarioMananaInicio={profesor.horarioMananaInicio}
              horarioMananaFin={profesor.horarioMananaFin}
              horarioTardeInicio={profesor.horarioTardeInicio}
              horarioTardeFin={profesor.horarioTardeFin}
              espacioCompartidoId={profesor.espacioCompartidoId}
              syncGoogleCalendar={profesor.syncGoogleCalendar}
              hasGoogleAccount={profesor.hasGoogleAccount}
              packs={packs}
            />
          </div>
        )}

        {activeTab === 'perfil' && (
          <div className="tab-panel">
            <ProfileForm profesor={profesor} />
          </div>
        )}

        {activeTab === 'seguridad' && (
          <div className="tab-panel">
            <PasswordForm />
          </div>
        )}
      </div>
    </div>
  )
}
