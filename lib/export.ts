// Utilidades para exportar datos a CSV

type CSVRow = Record<string, string | number | boolean | null | undefined>

export function exportToCSV<T extends CSVRow>(
  data: T[],
  columns: { key: keyof T; label: string }[],
  filename: string
): void {
  if (data.length === 0) {
    return
  }

  // Headers
  const headers = columns.map(col => `"${col.label}"`).join(',')

  // Rows
  const rows = data.map(row =>
    columns.map(col => {
      const value = row[col.key]
      if (value === null || value === undefined) {
        return '""'
      }
      if (typeof value === 'string') {
        const escaped = value.replace(/"/g, '""')
        // Prefix formula-triggering chars to prevent Excel injection
        if (/^[=+\-@\t\r\n]/.test(escaped)) {
          return `"'${escaped}"`
        }
        return `"${escaped}"`
      }
      return `"${value}"`
    }).join(',')
  )

  const csvContent = [headers, ...rows].join('\n')

  // BOM para UTF-8 (para que Excel lo abra bien con acentos)
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

  // Descargar
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Configuraciones específicas para cada tipo de exportación
export const ALUMNOS_COLUMNS = [
  { key: 'nombre' as const, label: 'Nombre' },
  { key: 'email' as const, label: 'Email' },
  { key: 'telefono' as const, label: 'Teléfono' },
  { key: 'genero' as const, label: 'Género' },
  { key: 'packType' as const, label: 'Tipo de Pack' },
  { key: 'precio' as const, label: 'Precio' },
  { key: 'estaActivo' as const, label: 'Activo' },
  { key: 'clasesEsteMes' as const, label: 'Clases Este Mes' },
]

export const PAGOS_COLUMNS = [
  { key: 'alumnoNombre' as const, label: 'Alumno' },
  { key: 'monto' as const, label: 'Monto' },
  { key: 'estado' as const, label: 'Estado' },
  { key: 'fechaPago' as const, label: 'Fecha de Pago' },
  { key: 'fechaVencimiento' as const, label: 'Fecha de Vencimiento' },
  { key: 'mesCorrespondiente' as const, label: 'Mes' },
  { key: 'tipoPago' as const, label: 'Tipo' },
]
