'use client'

import { User, Calendar, DollarSign, Settings2 } from 'lucide-react'
import { Accordion } from '@/components/accordion'
import { ProfileForm } from './profile-form'
import { PasswordForm } from './password-form'
import { HorariosSection } from './horarios-section'
import { PacksSection } from './packs-section'
import { updatePreferencias } from './actions'
import { useState } from 'react'

type Horario = {
  id: string
  diaSemana: number
  horaInicio: string
  horaFin: string
  esManiana: boolean
  estaActivo: boolean
}

type Pack = {
  id: string
  nombre: string
  clasesPorSemana: number
  precio: string
  estaActivo: boolean
}

type Profesor = {
  id: string
  nombre: string
  email: string
  telefono: string | null
  horasAnticipacionMinima: number
  maxAlumnosPorClase: number
  horarioMananaInicio: string
  horarioMananaFin: string
  horarioTardeInicio: string
  horarioTardeFin: string
  espacioCompartidoId: string | null
  syncGoogleCalendar: boolean
  hasGoogleAccount: boolean
}

interface ConfiguracionClientProps {
  profesor: Profesor
  horarios: Horario[]
  packs: Pack[]
}

export function ConfiguracionClient({ profesor, horarios, packs }: ConfiguracionClientProps) {
  const [isLoadingHorarios, setIsLoadingHorarios] = useState(false)
  const [messageHorarios, setMessageHorarios] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [isLoadingPacks, setIsLoadingPacks] = useState(false)
  const [messagePacks, setMessagePacks] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [isLoadingSistema, setIsLoadingSistema] = useState(false)
  const [messageSistema, setMessageSistema] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  async function handleHorariosSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoadingHorarios(true)
    setMessageHorarios(null)

    const formData = new FormData(e.currentTarget)

    try {
      await updatePreferencias(formData)
      setMessageHorarios({ type: 'success', text: 'Configuración de horarios actualizada correctamente' })
      setTimeout(() => setMessageHorarios(null), 3000)
    } catch (err: any) {
      setMessageHorarios({ type: 'error', text: err.message || 'Error al actualizar configuración' })
    } finally {
      setIsLoadingHorarios(false)
    }
  }

  async function handlePacksSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoadingPacks(true)
    setMessagePacks(null)

    const formData = new FormData(e.currentTarget)

    try {
      await updatePreferencias(formData)
      setMessagePacks({ type: 'success', text: 'Configuración de packs actualizada correctamente' })
      setTimeout(() => setMessagePacks(null), 3000)
    } catch (err: any) {
      setMessagePacks({ type: 'error', text: err.message || 'Error al actualizar configuración' })
    } finally {
      setIsLoadingPacks(false)
    }
  }

  async function handleSistemaSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoadingSistema(true)
    setMessageSistema(null)

    const formData = new FormData(e.currentTarget)

    try {
      await updatePreferencias(formData)
      setMessageSistema({ type: 'success', text: 'Configuración del sistema actualizada correctamente' })
      setTimeout(() => setMessageSistema(null), 3000)
    } catch (err: any) {
      setMessageSistema({ type: 'error', text: err.message || 'Error al actualizar configuración' })
    } finally {
      setIsLoadingSistema(false)
    }
  }

  return (
    <div className="settings-accordion-container">
      {/* Sección: Mi Perfil */}
      <Accordion
        title="Mi Perfil"
        icon={<User size={24} style={{ color: 'rgba(147, 155, 245, 0.9)' }} />}
        defaultOpen={true}
      >
        <ProfileForm profesor={profesor} />
        <div className="form-divider" style={{ margin: '2rem 0' }}></div>
        <PasswordForm />
      </Accordion>

      {/* Sección: Horarios y Disponibilidad */}
      <Accordion
        title="Horarios y Disponibilidad"
        icon={<Calendar size={24} style={{ color: 'rgba(147, 155, 245, 0.9)' }} />}
      >
        <HorariosSection
          horarios={horarios}
          horarioMananaInicio={profesor.horarioMananaInicio}
          horarioMananaFin={profesor.horarioMananaFin}
          horarioTardeInicio={profesor.horarioTardeInicio}
          horarioTardeFin={profesor.horarioTardeFin}
        />

        <div className="form-divider" style={{ margin: '3rem 0' }}></div>

        {/* Configuración de Horarios */}
        <div className="section-content">
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.95)', marginBottom: '1.5rem' }}>
            Configuración de Clases
          </h3>

          {messageHorarios && (
            <div className={`form-message ${messageHorarios.type}`} style={{ marginBottom: '1.5rem' }}>
              {messageHorarios.text}
            </div>
          )}

          <form onSubmit={handleHorariosSubmit} className="form-content">
            <div className="form-group">
              <label>Horario de Mañana por Default</label>
              <div className="form-row">
                <input
                  type="time"
                  name="horarioMananaInicio"
                  defaultValue={profesor.horarioMananaInicio}
                  required
                  disabled={isLoadingHorarios}
                  className="form-time-input"
                />
                <input
                  type="time"
                  name="horarioMananaFin"
                  defaultValue={profesor.horarioMananaFin}
                  required
                  disabled={isLoadingHorarios}
                  className="form-time-input"
                />
              </div>
              <p className="form-hint">Rango horario por defecto para turnos de mañana</p>
            </div>

            <div className="form-group">
              <label>Horario de Tarde por Default</label>
              <div className="form-row">
                <input
                  type="time"
                  name="horarioTardeInicio"
                  defaultValue={profesor.horarioTardeInicio}
                  required
                  disabled={isLoadingHorarios}
                  className="form-time-input"
                />
                <input
                  type="time"
                  name="horarioTardeFin"
                  defaultValue={profesor.horarioTardeFin}
                  required
                  disabled={isLoadingHorarios}
                  className="form-time-input"
                />
              </div>
              <p className="form-hint">Rango horario por defecto para turnos de tarde</p>
            </div>

            <div className="form-group">
              <label>Capacidad Máxima por Clase</label>
              <select
                name="maxAlumnosPorClase"
                defaultValue={profesor.maxAlumnosPorClase}
                required
                disabled={isLoadingHorarios}
                className="form-select"
              >
                <option value="1">1 alumno</option>
                <option value="2">2 alumnos</option>
                <option value="3">3 alumnos</option>
                <option value="4">4 alumnos</option>
                <option value="5">5 alumnos</option>
                <option value="6">6 alumnos</option>
                <option value="8">8 alumnos</option>
                <option value="10">10 alumnos</option>
              </select>
              <p className="form-hint">Cantidad máxima de alumnos que pueden reservar la misma clase</p>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={isLoadingHorarios}>
                {isLoadingHorarios ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </form>
        </div>
      </Accordion>

      {/* Sección: Packs y Precios */}
      <Accordion
        title="Packs y Precios"
        icon={<DollarSign size={24} style={{ color: 'rgba(147, 155, 245, 0.9)' }} />}
      >
        <div className="section-content">
          {messagePacks && (
            <div className={`form-message ${messagePacks.type}`} style={{ marginBottom: '1.5rem' }}>
              {messagePacks.text}
            </div>
          )}

          <form onSubmit={handlePacksSubmit} className="form-content">
          <div className="form-group">
            <label>Anticipación Mínima para Reservas</label>
            <select
              name="horasAnticipacionMinima"
              defaultValue={profesor.horasAnticipacionMinima}
              required
              disabled={isLoadingPacks}
              className="form-select"
            >
              <option value="1">1 hora</option>
              <option value="2">2 horas</option>
              <option value="3">3 horas</option>
              <option value="4">4 horas</option>
              <option value="6">6 horas</option>
              <option value="12">12 horas</option>
              <option value="24">24 horas</option>
            </select>
            <p className="form-hint">Tiempo mínimo de anticipación que deben tener los alumnos para reservar clases</p>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isLoadingPacks}>
              {isLoadingPacks ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </form>

        <div className="form-divider" style={{ margin: '3rem 0' }}></div>

        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.95)', marginBottom: '0.5rem' }}>
            Paquetes de Clases
          </h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1.5rem' }}>
            Configurá tus paquetes de clases con precios personalizados
          </p>
          <PacksSection packs={packs} />
        </div>
        </div>
      </Accordion>

      {/* Sección: Integraciones y Sistema */}
      <Accordion
        title="Integraciones y Sistema"
        icon={<Settings2 size={24} style={{ color: 'rgba(147, 155, 245, 0.9)' }} />}
      >
        <div className="section-content">
          {messageSistema && (
            <div className={`form-message ${messageSistema.type}`} style={{ marginBottom: '1.5rem' }}>
              {messageSistema.text}
            </div>
          )}

          <form onSubmit={handleSistemaSubmit} className="form-content">
          <div className="form-group">
            <label>Espacio Compartido</label>
            <input
              type="text"
              name="espacioCompartidoId"
              defaultValue={profesor.espacioCompartidoId || ''}
              placeholder="Código de espacio (ej: studio-palermo)"
              disabled={isLoadingSistema}
              className="form-input"
            />
            <p className="form-hint">
              Si trabajás con otros profesores en el mismo lugar, usá el mismo código para coordinar horarios.
              Todos los profesores con el mismo código verán las clases de los demás en su calendario.
            </p>
          </div>

          <div className="form-divider" style={{ margin: '2rem 0' }}></div>

          <div className="form-group">
            <label>Sincronización con Google Calendar</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="checkbox"
                name="syncGoogleCalendar"
                defaultChecked={profesor.syncGoogleCalendar}
                disabled={isLoadingSistema || !profesor.hasGoogleAccount}
                style={{ width: 'auto', margin: 0 }}
                className="form-checkbox"
              />
              <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                Agregar mis clases automáticamente a Google Calendar
              </span>
            </div>
            {!profesor.hasGoogleAccount && (
              <p className="form-hint" style={{ color: 'rgba(255, 180, 100, 0.9)', marginTop: '0.75rem' }}>
                ⚠️ Para usar esta función, primero debes iniciar sesión con Google. Cerrá sesión y volvé a iniciar con tu cuenta de Google.
              </p>
            )}
            {profesor.hasGoogleAccount && (
              <p className="form-hint" style={{ marginTop: '0.75rem' }}>
                Cuando esta opción está activada, todas tus clases se agregarán automáticamente a tu Google Calendar.
                Tus alumnos recibirán invitaciones por email con la información de la clase.
              </p>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isLoadingSistema}>
              {isLoadingSistema ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </form>
        </div>
      </Accordion>
    </div>
  )
}
