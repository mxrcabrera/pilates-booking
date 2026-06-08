'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, User, Trash2 } from 'lucide-react'
import { DialogBase } from '@/components/ui/dialog-base'

interface ListaEsperaEntry {
  id: string
  posicion: number
  estado: string
  alumno: {
    id: string
    nombre: string
    email: string
  }
  fecha: string
  horaInicio: string
}

interface ListaEsperaDialogProps {
  isOpen: boolean
  onClose: () => void
  claseId?: string
  fecha?: Date
  horaInicio?: string
}

export function ListaEsperaDialog({ isOpen, onClose, claseId: _claseId, fecha, horaInicio }: ListaEsperaDialogProps) {
  const [listaEspera, setListaEspera] = useState<ListaEsperaEntry[]>([])
  const [loading, setLoading] = useState(false)

  const cargarListaEspera = useCallback(async () => {
    setLoading(true)
    try {
      const fechaStr = fecha?.toISOString().split('T')[0]
      const response = await fetch(`/api/v1/lista_espera?fecha=${fechaStr}`)
      const data = await response.json()
      setListaEspera(data.listaEspera || [])
    } catch (error) {
      console.error('Error al cargar lista de espera:', error)
    } finally {
      setLoading(false)
    }
  }, [fecha])

  useEffect(() => {
    if (isOpen && fecha && horaInicio) {
      cargarListaEspera()
    }
  }, [isOpen, fecha, horaInicio, cargarListaEspera])

  const eliminarDeLista = async (id: string) => {
    try {
      await fetch(`/api/v1/lista_espera?id=${id}`, { method: 'DELETE' })
      cargarListaEspera()
    } catch (error) {
      console.error('Error al eliminar de lista de espera:', error)
    }
  }

  const footerButtons = (
    <button
      type="button"
      onClick={onClose}
      className="btn-ghost"
    >
      Cerrar
    </button>
  )

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={onClose}
      title="Lista de Espera"
      footer={footerButtons}
    >
      <div className="dialog-title-with-badge" style={{ marginTop: '-1rem', marginBottom: '1rem' }}>
        <Clock className="w-5 h-5" />
        Lista de Espera
      </div>
      <div className="dialog-body">
        {loading ? (
          <p className="text-center" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Cargando...</p>
        ) : listaEspera.length === 0 ? (
          <p className="text-center" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>No hay alumnos en lista de espera</p>
        ) : (
          <div className="space-y-2">
            {listaEspera.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3"
                style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-lg)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8" style={{ background: 'rgba(90, 130, 220, 0.2)', color: 'rgba(180, 200, 255, 0.9)', borderRadius: '50%', fontWeight: 600 }}>
                    {entry.posicion}
                  </div>
                  <div>
                    <p className="font-medium flex items-center gap-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      <User className="w-4 h-4" />
                      {entry.alumno.nombre}
                    </p>
                    <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      {entry.horaInicio} - {entry.estado}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => eliminarDeLista(entry.id)}
                  className="horario-action-btn horario-action-btn-danger"
                  title="Eliminar de lista"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(80, 120, 200, 0.08)', background: 'rgba(255, 255, 255, 0.02)' }}>
        <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          Los alumnos en lista de espera serán notificados cuando haya disponibilidad.
        </p>
      </div>
    </DialogBase>
  )
}
