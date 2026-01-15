'use client'

import { useState } from 'react'
import { Users, DollarSign, Calendar, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight, Target, Award, BarChart3 } from 'lucide-react'
import type { ReportesData } from '@/lib/types'
import {
  IngresosChart,
  ClasesAlumnosChart,
  AsistenciaPorDiaChart,
  DistribucionPacksChart,
  HorariosPopularesChart
} from '@/components/charts'

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function formatPrecio(num: number): string {
  if (num === 0) return '$0'
  return `$${num.toLocaleString('es-AR')}`
}

function formatPorcentaje(num: number): string {
  const sign = num > 0 ? '+' : ''
  return `${sign}${num.toFixed(1)}%`
}

function TrendIcon({ value }: { value: number }) {
  if (value > 0) return <TrendingUp size={14} />
  if (value < 0) return <TrendingDown size={14} />
  return <Minus size={14} />
}

export function ReportesClient({ data }: { data: ReportesData }) {
  const [mesActual, setMesActual] = useState(new Date().getMonth())
  const [añoActual, setAñoActual] = useState(new Date().getFullYear())

  const mesAnterior = () => {
    if (mesActual === 0) {
      setMesActual(11)
      setAñoActual(a => a - 1)
    } else {
      setMesActual(m => m - 1)
    }
  }

  const mesSiguiente = () => {
    const now = new Date()
    if (añoActual === now.getFullYear() && mesActual === now.getMonth()) {
      return
    }
    if (mesActual === 11) {
      setMesActual(0)
      setAñoActual(a => a + 1)
    } else {
      setMesActual(m => m + 1)
    }
  }

  const esHoy = añoActual === new Date().getFullYear() && mesActual === new Date().getMonth()

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Reportes</h1>
        </div>
      </div>

      {/* Selector de mes */}
      <div className="reportes-mes-selector">
        <button onClick={mesAnterior} className="reportes-mes-btn">
          <ChevronLeft size={20} />
        </button>
        <span className="reportes-mes-label">
          {MESES[mesActual]} {añoActual}
        </span>
        <button
          onClick={mesSiguiente}
          className="reportes-mes-btn"
          disabled={esHoy}
          style={{ opacity: esHoy ? 0.3 : 1 }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Métricas principales */}
      <div className="reportes-grid">
        <div className="reportes-card">
          <div className="reportes-card-icon alumnos">
            <Users size={24} />
          </div>
          <div className="reportes-card-content">
            <span className="reportes-card-label">Alumnos Activos</span>
            <span className="reportes-card-value">{data.metricas.alumnosActivos}</span>
            <span className={`reportes-card-trend ${data.metricas.alumnosTrend > 0 ? 'up' : data.metricas.alumnosTrend < 0 ? 'down' : ''}`}>
              <TrendIcon value={data.metricas.alumnosTrend} />
              {formatPorcentaje(data.metricas.alumnosTrend)} vs mes anterior
            </span>
          </div>
        </div>

        <div className="reportes-card">
          <div className="reportes-card-icon ingresos">
            <DollarSign size={24} />
          </div>
          <div className="reportes-card-content">
            <span className="reportes-card-label">Ingresos del Mes</span>
            <span className="reportes-card-value">{formatPrecio(data.metricas.ingresosMes)}</span>
            <span className={`reportes-card-trend ${data.metricas.ingresosTrend > 0 ? 'up' : data.metricas.ingresosTrend < 0 ? 'down' : ''}`}>
              <TrendIcon value={data.metricas.ingresosTrend} />
              {formatPorcentaje(data.metricas.ingresosTrend)} vs mes anterior
            </span>
          </div>
        </div>

        <div className="reportes-card">
          <div className="reportes-card-icon clases">
            <Calendar size={24} />
          </div>
          <div className="reportes-card-content">
            <span className="reportes-card-label">Clases Dictadas</span>
            <span className="reportes-card-value">{data.metricas.clasesDictadas}</span>
            <span className={`reportes-card-trend ${data.metricas.clasesTrend > 0 ? 'up' : data.metricas.clasesTrend < 0 ? 'down' : ''}`}>
              <TrendIcon value={data.metricas.clasesTrend} />
              {formatPorcentaje(data.metricas.clasesTrend)} vs mes anterior
            </span>
          </div>
        </div>
      </div>

      {/* Gráficos de tendencia - Solo si hay datos */}
      {data.graficos && (
        <div className="reportes-charts-section">
          <h2>Tendencias</h2>
          <div className="reportes-charts-grid">
            <IngresosChart data={data.graficos.historico} />
            <ClasesAlumnosChart data={data.graficos.historico} />
          </div>
        </div>
      )}

      {/* Estadísticas adicionales */}
      <div className="reportes-section">
        <h2>Asistencia</h2>
        <div className="reportes-stats-row">
          <div className="reportes-stat">
            <span className="reportes-stat-value success">{data.asistencia.presentes}</span>
            <span className="reportes-stat-label">Presentes</span>
          </div>
          <div className="reportes-stat">
            <span className="reportes-stat-value warning">{data.asistencia.ausentes}</span>
            <span className="reportes-stat-label">Ausentes</span>
          </div>
          <div className="reportes-stat">
            <span className="reportes-stat-value">{data.asistencia.tasaAsistencia}%</span>
            <span className="reportes-stat-label">Tasa de asistencia</span>
          </div>
        </div>
      </div>

      {/* Gráfico de asistencia por día */}
      {data.graficos && (
        <div className="reportes-charts-section">
          <div className="reportes-charts-grid">
            <AsistenciaPorDiaChart data={data.graficos.asistenciaPorDia} />
            <HorariosPopularesChart data={data.graficos.horarios} />
          </div>
        </div>
      )}

      <div className="reportes-section">
        <h2>Pagos</h2>
        <div className="reportes-stats-row">
          <div className="reportes-stat">
            <span className="reportes-stat-value success">{data.pagos.pagados}</span>
            <span className="reportes-stat-label">Pagados</span>
          </div>
          <div className="reportes-stat">
            <span className="reportes-stat-value warning">{data.pagos.pendientes}</span>
            <span className="reportes-stat-label">Pendientes</span>
          </div>
          <div className="reportes-stat">
            <span className="reportes-stat-value danger">{data.pagos.vencidos}</span>
            <span className="reportes-stat-label">Vencidos</span>
          </div>
        </div>
      </div>

      <div className="reportes-section">
        <h2>Ocupación</h2>
        <div className="reportes-ocupacion">
          <div className="reportes-ocupacion-bar">
            <div
              className="reportes-ocupacion-fill"
              style={{ width: `${data.ocupacion.promedio}%` }}
            />
          </div>
          <span className="reportes-ocupacion-label">
            {data.ocupacion.promedio}% ocupación promedio
          </span>
        </div>
        <div className="reportes-stats-row" style={{ marginTop: '1rem' }}>
          <div className="reportes-stat">
            <span className="reportes-stat-value">{data.ocupacion.horasPico}</span>
            <span className="reportes-stat-label">Hora más demandada</span>
          </div>
          <div className="reportes-stat">
            <span className="reportes-stat-value">{data.ocupacion.diaPico}</span>
            <span className="reportes-stat-label">Día más ocupado</span>
          </div>
        </div>
      </div>

      {/* Distribución de packs */}
      {data.graficos && data.graficos.distribucionPacks.length > 0 && (
        <div className="reportes-charts-section">
          <h2>Distribución</h2>
          <div className="reportes-charts-grid single">
            <DistribucionPacksChart data={data.graficos.distribucionPacks} />
          </div>
        </div>
      )}

      {/* Reportes Avanzados - Solo plan ESTUDIO */}
      {data.avanzados && (
        <>
          <div className="reportes-section reportes-avanzados">
            <div className="reportes-avanzados-header">
              <BarChart3 size={20} />
              <h2>Análisis Avanzado</h2>
              <span className="plan-badge">Max</span>
            </div>

            <div className="reportes-grid">
              <div className="reportes-card">
                <div className="reportes-card-icon proyeccion">
                  <Target size={24} />
                </div>
                <div className="reportes-card-content">
                  <span className="reportes-card-label">Proyección Anual</span>
                  <span className="reportes-card-value">{formatPrecio(data.avanzados.proyeccionIngresos)}</span>
                  <span className="reportes-card-hint">Basado en últimos 3 meses</span>
                </div>
              </div>

              <div className="reportes-card">
                <div className="reportes-card-icon ingreso-alumno">
                  <DollarSign size={24} />
                </div>
                <div className="reportes-card-content">
                  <span className="reportes-card-label">Ingreso por Alumno</span>
                  <span className="reportes-card-value">{formatPrecio(data.avanzados.ingresosPorAlumno)}</span>
                  <span className="reportes-card-hint">Promedio mensual</span>
                </div>
              </div>

              <div className="reportes-card">
                <div className="reportes-card-icon retencion">
                  <Users size={24} />
                </div>
                <div className="reportes-card-content">
                  <span className="reportes-card-label">Tasa de Retención</span>
                  <span className="reportes-card-value">{data.avanzados.tasaRetencion}%</span>
                  <span className="reportes-card-hint">Últimos 3 meses</span>
                </div>
              </div>
            </div>
          </div>

          <div className="reportes-section">
            <h2>Comparativa Anual</h2>
            <div className="reportes-comparativa">
              <div className="reportes-comparativa-item">
                <span className="reportes-comparativa-label">Este año</span>
                <span className="reportes-comparativa-value">{formatPrecio(data.avanzados.comparativaAnual.ingresosEsteAño)}</span>
              </div>
              <div className="reportes-comparativa-vs">vs</div>
              <div className="reportes-comparativa-item">
                <span className="reportes-comparativa-label">Año anterior</span>
                <span className="reportes-comparativa-value">{formatPrecio(data.avanzados.comparativaAnual.ingresosAñoAnterior)}</span>
              </div>
              <div className="reportes-comparativa-result">
                <span className={`reportes-comparativa-variacion ${data.avanzados.comparativaAnual.variacion >= 0 ? 'up' : 'down'}`}>
                  <TrendIcon value={data.avanzados.comparativaAnual.variacion} />
                  {data.avanzados.comparativaAnual.variacion >= 0 ? '+' : ''}{data.avanzados.comparativaAnual.variacion}%
                </span>
              </div>
            </div>
          </div>

          {data.avanzados.topAlumnos.length > 0 && (
            <div className="reportes-section">
              <h2>Top Alumnos del Mes</h2>
              <div className="reportes-top-alumnos">
                {data.avanzados.topAlumnos.map((alumno, i) => (
                  <div key={alumno.nombre} className="reportes-top-alumno">
                    <div className="reportes-top-rank">
                      {i === 0 ? <Award size={18} className="gold" /> : i === 1 ? <Award size={18} className="silver" /> : i === 2 ? <Award size={18} className="bronze" /> : <span>{i + 1}</span>}
                    </div>
                    <div className="reportes-top-info">
                      <span className="reportes-top-nombre">{alumno.nombre}</span>
                      <span className="reportes-top-stats">{alumno.clases} clases · {alumno.asistencia}% asistencia</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
