'use client'

import { User, Lock, Camera, Ghost } from 'lucide-react'
import { AccordionGroup, Accordion } from '@/components/accordion'
import { ProfileForm } from '../configuracion/profile-form'
import { PasswordForm } from '../configuracion/password-form'
import { AvatarUpload } from '@/components/avatar-upload'
import { BuddyUpload } from '@/components/buddy-upload'

interface ProfesorProp {
  id: string
  nombre: string
  email: string
  telefono: string | null
  avatarUrl: string | null
  buddyGreetingUrl: string | null
  buddyCelebrateUrl: string | null
  buddyZenUrl: string | null
}

export function PerfilClient({ profesor }: { profesor: ProfesorProp }) {
  return (
    <div className="flex flex-col gap-10 pb-24">
      <AccordionGroup defaultOpenId="datos-personales">

        {/* Sección: Foto de Perfil */}
        <Accordion
          id="avatar"
          title="Foto de Perfil"
          icon={<Camera size={20} className="text-indigo-400" />}
        >
          <div className="py-6 px-1">
            <AvatarUpload currentAvatar={profesor.avatarUrl} userName={profesor.nombre} />
          </div>
        </Accordion>

        {/* Sección: Mascota de Marca */}
        <Accordion
          id="mascota"
          title="Identidad de Marca (Welfi)"
          icon={<Ghost size={20} className="text-indigo-400" />}
        >
          <div className="py-6 px-1">
            <BuddyUpload
              currentGreeting={profesor.buddyGreetingUrl}
              currentCelebrate={profesor.buddyCelebrateUrl}
              currentZen={profesor.buddyZenUrl}
            />
          </div>
        </Accordion>

        {/* Sección: Datos Personales */}
        <Accordion
          id="datos-personales"
          title="Datos del Profesor"
          icon={<User size={20} className="text-indigo-400" />}
        >
          <div className="py-6 px-1">
            <ProfileForm profesor={profesor} />
          </div>
        </Accordion>

        {/* Sección: Seguridad */}
        <Accordion
          id="seguridad"
          title="Seguridad y Acceso"
          icon={<Lock size={20} className="text-indigo-400" />}
        >
          <div className="py-6 px-1">
            <PasswordForm />
          </div>
        </Accordion>

      </AccordionGroup>
    </div>
  )
}