'use client'

import { User, Lock, Camera, Ghost } from 'lucide-react'
import { AccordionGroup, Accordion } from '@/components/accordion'
import { ProfileForm } from '../configuracion/profile-form'
import { PasswordForm } from '../configuracion/password-form'
import { AvatarUpload } from '@/components/avatar-upload'
import { MascotConfig } from '@/components/mascot-config'
import type { MascotImage, MascotRule } from '@/lib/mascot'

interface ProfesorProp {
  id: string
  nombre: string
  email: string
  telefono: string | null
  avatarUrl: string | null
  buddyName: string | null
  mascotImages: MascotImage[]
  mascotRules: MascotRule[]
}

export function PerfilClient({ profesor }: { profesor: ProfesorProp }) {
  return (
    <div className="flex flex-col gap-10 pb-24">
      <AccordionGroup defaultOpenId="datos-personales">

        <Accordion
          id="avatar"
          title="Foto de Perfil"
          icon={<Camera size={20} className="text-indigo-400" />}
        >
          <div className="py-6 px-1">
            <AvatarUpload currentAvatar={profesor.avatarUrl} userName={profesor.nombre} />
          </div>
        </Accordion>

        <Accordion
          id="mascota"
          title="Identidad de Marca"
          icon={<Ghost size={20} className="text-indigo-400" />}
        >
          <div className="py-6 px-1">
            <MascotConfig
              initialName={profesor.buddyName ?? 'Welfi'}
              initialImages={profesor.mascotImages}
              initialRules={profesor.mascotRules}
            />
          </div>
        </Accordion>

        <Accordion
          id="datos-personales"
          title="Datos del Profesor"
          icon={<User size={20} className="text-indigo-400" />}
        >
          <div className="py-6 px-1">
            <ProfileForm profesor={profesor} />
          </div>
        </Accordion>

        <Accordion
          id="seguridad"
          title="Seguridad"
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
