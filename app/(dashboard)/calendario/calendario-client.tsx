'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { ClaseDialog } from './clase-dialog'
import { ClaseDetailDialog } from './clase-detail-dialog'

type Clase = {
  id: string
  fecha: Date
  horaInicio: string
  horaRecurrente: string | null
  diasSemana: number[]
  estado: string
  esClasePrueba: boolean
  esRecurrente: boolean
  frecuenciaSemanal: number | null
  alumna: {
    id: string
    nombre: string
  } | null
}

type Alumna = {
  id: string
  nombre: string
}

export function CalendarioClient({ clases, alumnas }: { clases: Clase[]; alumnas: Alumna[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedClase, setSelectedClase] = useState<Clase | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const inicioMes = startOfMonth(currentMonth)
  const finMes = endOfMonth(currentMonth)
  const inicioCal = startOfWeek(inicioMes, { weekStartsOn: 1 })
  const finCal = endOfWeek(finMes, { weekStartsOn: 1 })
  const dias = eachDayOfInterval({ start: inicioCal, end: finCal })

  const clasesPorDia = clases.reduce((acc, clase) => {
    const diaKey = format(clase.fecha, 'yyyy-MM-dd')
    if (!acc[diaKey]) acc[diaKey] = []
    acc[diaKey].push(clase)
    return acc
  }, {} as Record<string, Clase[]>)

  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  const handleDayClick = (dia: Date) => {
    setSelectedDate(dia)
    setSelectedClase(null)
    setIsDialogOpen(true)
  }

  const handleClaseClick = (clase: Clase, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedClase(clase)
    setIsDetailOpen(true)
  }

  const handleNewClase = () => {
    setSelectedDate(new Date())
    setSelectedClase(null)
    setIsDialogOpen(true)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Calendario</h1>
          <p className="page-subtitle">
            {format(currentMonth, "MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
        <button onClick={handleNewClase} className="btn-primary">
          <Plus size={20} />
          <span>Nueva Clase</span>
        </button>
      </div>

      <div className="calendar-card">
        <div className="calendar-header">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="calendar-nav-btn"
          >
            <ChevronLeft size={20} />
          </button>
          <h2>{format(currentMonth, "MMMM yyyy", { locale: es })}</h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="calendar-nav-btn"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="calendar-grid">
          {diasSemana.map(dia => (
            <div key={dia} className="calendar-weekday">{dia}</div>
          ))}

          {dias.map(dia => {
            const diaKey = format(dia, 'yyyy-MM-dd')
            const clasesDelDia = clasesPorDia[diaKey] || []
            const esHoy = isToday(dia)
            const esMesActual = isSameMonth(dia, currentMonth)

            return (
              <div
                key={diaKey}
                className={`calendar-day ${!esMesActual ? 'other-month' : ''} ${esHoy ? 'today' : ''}`}
                onClick={() => handleDayClick(dia)}
              >
                <div className="day-number">{format(dia, 'd')}</div>
                <div className="day-classes">
                  {clasesDelDia.slice(0, 3).map(clase => (
                    <div
                      key={clase.id}
                      className={`day-class ${clase.estado}`}
                      onClick={(e) => handleClaseClick(clase, e)}
                    >
                      <span className="class-time">{clase.horaInicio}</span>
                      <span className="class-name">{clase.alumna?.nombre || 'Disponible'}</span>
                    </div>
                  ))}
                  {clasesDelDia.length > 3 && (
                    <div className="day-class-more">+{clasesDelDia.length - 3} más</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <ClaseDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setSelectedDate(null)
          setSelectedClase(null)
        }}
        clase={selectedClase}
        fecha={selectedDate}
        alumnas={alumnas}
      />

      <ClaseDetailDialog
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedClase(null)
        }}
        clase={selectedClase}
        onEdit={() => {
          setIsDetailOpen(false)
          setIsDialogOpen(true)
        }}
      />
    </div>
  )
}