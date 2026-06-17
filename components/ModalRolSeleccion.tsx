'use client'

import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

interface ModalRolSeleccionProps {
  isOpen: boolean
  onClose: () => void
}

export function ModalRolSeleccion({ isOpen, onClose }: ModalRolSeleccionProps) {
  const router = useRouter()

  if (!isOpen) return null

  const handleProfesor = () => {
    router.push('/signup?role=profesor')
    onClose()
  }

  const handleAlumno = () => {
    router.push('/signup?role=alumno')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-lg p-6 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-2xl font-bold mb-2">¿Cómo querés usar Pilates Booking?</h2>
        <p className="text-muted-foreground mb-6">
          Seleccioná tu rol para continuar
        </p>
        
        <div className="space-y-3">
          <button
            onClick={handleProfesor}
            className="w-full p-4 border rounded-lg text-left hover:bg-accent transition-colors"
          >
            <div className="font-bold text-lg mb-1">Soy profesor</div>
            <div className="text-sm text-muted-foreground">
              Gestioná tu agenda, alumnos y pagos
            </div>
          </button>
          
          <button
            onClick={handleAlumno}
            className="w-full p-4 border rounded-lg text-left hover:bg-accent transition-colors"
          >
            <div className="font-bold text-lg mb-1">Soy alumno</div>
            <div className="text-sm text-muted-foreground">
              Reservá tus clases de pilates
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
