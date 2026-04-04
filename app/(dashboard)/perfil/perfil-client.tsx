'use client'

import { User, Lock } from 'lucide-react'
import { AccordionGroup, Accordion } from '@/components/accordion'
import { ProfileForm } from '../configuracion/profile-form'
import { PasswordForm } from '../configuracion/password-form'
import { AvatarUpload } from '@/components/avatar-upload'
import { BuddyUpload } from '@/components/buddy-upload'

type ProfesorPerfil = {
  nombre: string
  email: string
  telefono: string | null
  avatarUrl: string | null
  buddyGreetingUrl: string | null
  buddyCelebrateUrl: string | null
  buddyZenUrl: string | null
}

interface PerfilClientProps {
  profesor: ProfesorPerfil
}

export function PerfilClient({ profesor }: PerfilClientProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="content-card p-6">
        <AvatarUpload currentAvatar={profesor.avatarUrl} userName={profesor.nombre} />
      </div>
      <div className="content-card p-6">
        <BuddyUpload 
          currentGreeting={profesor.buddyGreetingUrl}
          currentCelebrate={profesor.buddyCelebrateUrl}
          currentZen={profesor.buddyZenUrl}
        />
      </div>
      
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
    </div>
  )
}
