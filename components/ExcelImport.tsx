'use client'

import { useState } from 'react'

interface ImportResults {
  alumnos: { created: number; errors: number }
  clases: { created: number; errors: number }
  pagos: { created: number; errors: number }
}

export function ExcelImport() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [results, setResults] = useState<ImportResults | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setResults(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/import/excel', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to import Excel')
        return
      }

      setResults(data.results)
    } catch {
      setError('Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Importar Datos desde Excel</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar archivo Excel
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-violet-50 file:text-violet-700
              hover:file:bg-violet-100"
          />
        </div>

        {file && (
          <div className="text-sm text-gray-600">
            Archivo seleccionado: {file.name}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:bg-violet-700 transition-colors"
        >
          {isUploading ? 'Procesando...' : 'Importar'}
        </button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {results && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Importación completada</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Alumnos:</span> {results.alumnos.created} creados, {results.alumnos.errors} errores
              </div>
              <div>
                <span className="font-medium">Clases:</span> {results.clases.created} creadas, {results.clases.errors} errores
              </div>
              <div>
                <span className="font-medium">Pagos:</span> {results.pagos.created} creados, {results.pagos.errors} errores
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
