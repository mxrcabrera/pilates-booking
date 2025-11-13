'use client'

import { useState } from 'react'
import { Clock, User, Lock, Settings } from 'lucide-react'
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

type Profesora = {
  id: string
  nombre: string
  email: string
  telefono: string | null
  horasAnticipacionMinima: number
  maxAlumnasPorClase: number
  horarioMananaInicio: string
  horarioMananaFin: string
  horarioTardeInicio: string
  horarioTardeFin: string
  espacioCompartidoId: string | null
}

interface ConfiguracionClientProps {
  profesora: Profesora
  horarios: Horario[]
}

type Tab = 'horarios' | 'preferencias' | 'perfil' | 'seguridad'

export function ConfiguracionClient({ profesora, horarios }: ConfiguracionClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('horarios')

  return (
    <div className="settings-tabs">
      {/* Tabs Navigation */}
      <div className="tabs-nav">
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
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'horarios' && (
          <div className="tab-panel">
            <HorariosSection
              horarios={horarios}
              horarioMananaInicio={profesora.horarioMananaInicio}
              horarioMananaFin={profesora.horarioMananaFin}
              horarioTardeInicio={profesora.horarioTardeInicio}
              horarioTardeFin={profesora.horarioTardeFin}
            />
          </div>
        )}

        {activeTab === 'preferencias' && (
          <div className="tab-panel">
            <PreferenciasSection
              horasAnticipacionMinima={profesora.horasAnticipacionMinima}
              maxAlumnasPorClase={profesora.maxAlumnasPorClase}
              horarioMananaInicio={profesora.horarioMananaInicio}
              horarioMananaFin={profesora.horarioMananaFin}
              horarioTardeInicio={profesora.horarioTardeInicio}
              horarioTardeFin={profesora.horarioTardeFin}
              espacioCompartidoId={profesora.espacioCompartidoId}
            />
          </div>
        )}

        {activeTab === 'perfil' && (
          <div className="tab-panel">
            <ProfileForm profesora={profesora} />
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
