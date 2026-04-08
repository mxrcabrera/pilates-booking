'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Clock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Lista de Espera
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <p className="text-center text-gray-500">Cargando...</p>
          ) : listaEspera.length === 0 ? (
            <p className="text-center text-gray-500">No hay alumnos en lista de espera</p>
          ) : (
            <div className="space-y-2">
              {listaEspera.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold">
                      {entry.posicion}
                    </div>
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {entry.alumno.nombre}
                      </p>
                      <p className="text-sm text-gray-500">
                        {entry.horaInicio} - {entry.estado}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => eliminarDeLista(entry.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Eliminar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-600">
            Los alumnos en lista de espera serán notificados cuando haya disponibilidad.
          </p>
        </div>
      </div>
    </div>
  )
}
