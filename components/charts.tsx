'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

function formatPrecio(num: number): string {
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}k`
  return `$${num}`
}

interface HistoricoData {
  mes: string
  ingresos: number
  clases: number
  alumnos: number
}

interface AsistenciaDiaData {
  dia: string
  clases: number
  asistencia: number
}

interface PackData {
  pack: string
  cantidad: number
  [key: string]: string | number
}

interface HorarioData {
  hora: string
  cantidad: number
}

export function IngresosChart({ data }: { data: HistoricoData[] }) {
  return (
    <div className="chart-container">
      <h3 className="chart-title">Ingresos (últimos 6 meses)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="mes"
            stroke="rgba(255,255,255,0.5)"
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.5)"
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
            tickFormatter={formatPrecio}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(30, 30, 40, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value) => [formatPrecio(value as number), 'Ingresos']}
          />
          <Line
            type="monotone"
            dataKey="ingresos"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ fill: '#8b5cf6', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ClasesAlumnosChart({ data }: { data: HistoricoData[] }) {
  return (
    <div className="chart-container">
      <h3 className="chart-title">Clases y Alumnos</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="mes"
            stroke="rgba(255,255,255,0.5)"
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.5)"
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(30, 30, 40, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.7)' }}>{value}</span>}
          />
          <Line
            type="monotone"
            dataKey="clases"
            name="Clases"
            stroke="#06b6d4"
            strokeWidth={2}
            dot={{ fill: '#06b6d4', r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="alumnos"
            name="Alumnos"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function AsistenciaPorDiaChart({ data }: { data: AsistenciaDiaData[] }) {
  return (
    <div className="chart-container">
      <h3 className="chart-title">Asistencia por día</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="dia"
            stroke="rgba(255,255,255,0.5)"
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
          />
          <YAxis
            stroke="rgba(255,255,255,0.5)"
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(30, 30, 40, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value, name) => {
              if (name === 'asistencia') return [`${value}%`, 'Asistencia']
              return [value as number, 'Clases']
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.7)' }}>{value}</span>}
          />
          <Bar dataKey="clases" name="Clases" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="asistencia" name="% Asistencia" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function DistribucionPacksChart({ data }: { data: PackData[] }) {
  if (data.length === 0) {
    return (
      <div className="chart-container">
        <h3 className="chart-title">Distribución de Packs</h3>
        <div className="chart-empty">Sin datos</div>
      </div>
    )
  }

  return (
    <div className="chart-container">
      <h3 className="chart-title">Distribución de Packs</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="cantidad"
            nameKey="pack"
            label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
            labelLine={{ stroke: 'rgba(255,255,255,0.3)' }}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'rgba(30, 30, 40, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value) => [`${value} alumnos`, '']}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function HorariosPopularesChart({ data }: { data: HorarioData[] }) {
  if (data.length === 0) {
    return (
      <div className="chart-container">
        <h3 className="chart-title">Horarios Populares</h3>
        <div className="chart-empty">Sin datos</div>
      </div>
    )
  }

  return (
    <div className="chart-container">
      <h3 className="chart-title">Horarios Populares</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            type="number"
            stroke="rgba(255,255,255,0.5)"
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="hora"
            stroke="rgba(255,255,255,0.5)"
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(30, 30, 40, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value) => [`${value} clases`, '']}
          />
          <Bar dataKey="cantidad" fill="#f59e0b" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
