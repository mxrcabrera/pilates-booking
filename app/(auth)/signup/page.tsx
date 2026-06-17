'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { ModalRolSeleccion } from '@/components/ModalRolSeleccion'

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'profesor'
  const [modalOpen, setModalOpen] = useState(!role)

  const handleModalClose = () => {
    setModalOpen(false)
  }

  // Redirigir al login existente con el rol pre-seleccionado
  useEffect(() => {
    if (!modalOpen) {
      router.push(`/login?role=${role}`)
    }
  }, [router, role, modalOpen])

  // Si no hay rol seleccionado, mostrar modal
  if (modalOpen) {
    return <ModalRolSeleccion isOpen={modalOpen} onClose={handleModalClose} />
  }

  return null
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <SignupContent />
    </Suspense>
  )
}
