'use client'

import { User, Lock } from 'lucide-react'
import { AccordionGroup, Accordion } from '@/components/accordion'
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
    <AccordionGroup>
      {/* Sección: Datos Personales */}
      <Accordion
        id="datos-personales"
        title="Datos Personales"
        icon={<User size={24} style={{ color: 'rgba(147, 155, 245, 0.9)' }} />}
      >
        <ProfileForm profesor={profesor} />
      </Accordion>

      {/* Sección: Seguridad */}
      <Accordion
        id="seguridad"
        title="Seguridad"
        icon={<Lock size={24} style={{ color: 'rgba(147, 155, 245, 0.9)' }} />}
      >
        <PasswordForm />
      </Accordion>
    </AccordionGroup>
  )
}
