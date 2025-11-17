'use client'

import { useState, useEffect } from 'react'
import { Calendar, DollarSign, Settings2, User } from 'lucide-react'
import { ClasesSection } from './clases-section'
import { PacksTab } from './packs-tab'
import { SistemaSection } from './sistema-section'
import { ProfileForm } from './profile-form'
import { PasswordForm } from './password-form'

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

type Tab = 'clases' | 'packs' | 'sistema' | 'cuenta'

export function ConfiguracionClient({ profesor, horarios, packs }: ConfiguracionClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('clases')

  useEffect(() => {
    // Check for hash in URL to set initial tab
    const hash = window.location.hash.slice(1) as Tab
    if (hash && ['clases', 'packs', 'sistema', 'cuenta'].includes(hash)) {
      setActiveTab(hash)
    }
  }, [])

  return (
    <div className="settings-tabs">
      {/* Tabs Navigation */}
      <div className="tabs-nav">
        <button
          onClick={() => setActiveTab('clases')}
          className={`tab-button ${activeTab === 'clases' ? 'active' : ''}`}
        >
          <Calendar size={20} />
          <span>Clases</span>
        </button>
        <button
          onClick={() => setActiveTab('packs')}
          className={`tab-button ${activeTab === 'packs' ? 'active' : ''}`}
        >
          <DollarSign size={20} />
          <span>Packs</span>
        </button>
        <button
          onClick={() => setActiveTab('sistema')}
          className={`tab-button ${activeTab === 'sistema' ? 'active' : ''}`}
        >
          <Settings2 size={20} />
          <span>Sistema</span>
        </button>
        <button
          onClick={() => setActiveTab('cuenta')}
          className={`tab-button ${activeTab === 'cuenta' ? 'active' : ''}`}
        >
          <User size={20} />
          <span>Cuenta</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'clases' && (
          <div className="tab-panel">
            <ClasesSection
              horarios={horarios}
              horarioMananaInicio={profesor.horarioMananaInicio}
              horarioMananaFin={profesor.horarioMananaFin}
              horarioTardeInicio={profesor.horarioTardeInicio}
              horarioTardeFin={profesor.horarioTardeFin}
              maxAlumnosPorClase={profesor.maxAlumnosPorClase}
            />
          </div>
        )}

        {activeTab === 'packs' && (
          <div className="tab-panel">
            <PacksTab
              packs={packs}
              horasAnticipacionMinima={profesor.horasAnticipacionMinima}
            />
          </div>
        )}

        {activeTab === 'sistema' && (
          <div className="tab-panel">
            <SistemaSection
              espacioCompartidoId={profesor.espacioCompartidoId}
              syncGoogleCalendar={profesor.syncGoogleCalendar}
              hasGoogleAccount={profesor.hasGoogleAccount}
            />
          </div>
        )}

        {activeTab === 'cuenta' && (
          <div className="tab-panel">
            <div className="settings-section">
              <div className="section-content">
                <ProfileForm profesor={profesor} />
                <div className="form-divider" style={{ margin: '3rem 0' }}></div>
                <PasswordForm />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
