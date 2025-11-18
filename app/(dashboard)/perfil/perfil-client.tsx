'use client'

import { User, Lock } from 'lucide-react'
import { Accordion } from '@/components/accordion'
import { ProfileForm } from '../configuracion/profile-form'
import { PasswordForm } from '../configuracion/password-form'

type Profesor = {
  id: string
  nombre: string
  email: string
  telefono: string | null
}

interface PerfilClientProps {
  profesor: Profesor
}

export function PerfilClient({ profesor }: PerfilClientProps) {
  return (
    <div className="settings-accordion-container">
      {/* Sección: Datos Personales */}
      <Accordion
        title="Datos Personales"
        icon={<User size={24} style={{ color: 'rgba(147, 155, 245, 0.9)' }} />}
        defaultOpen={true}
      >
        <ProfileForm profesor={profesor} />
      </Accordion>

      {/* Sección: Seguridad */}
      <Accordion
        title="Seguridad"
        icon={<Lock size={24} style={{ color: 'rgba(147, 155, 245, 0.9)' }} />}
      >
        <PasswordForm />
      </Accordion>
    </div>
  )
}
