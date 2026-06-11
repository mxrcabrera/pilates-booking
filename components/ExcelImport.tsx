'use client'

import { useState, useRef } from 'react'
import { DialogBase } from '@/components/ui/dialog-base'
import { Upload, FileSpreadsheet, X } from 'lucide-react'

interface ImportResults {
  alumnos: { created: number; updated: number; errors: number; errorDetails: string[] }
  clases: { created: number; errors: number; errorDetails: string[] }
  pagos: { created: number; errors: number; errorDetails: string[] }
}

interface ExcelImportProps {
  isOpen: boolean
  onClose: () => void
}

export function ExcelImport({ isOpen, onClose }: ExcelImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [results, setResults] = useState<ImportResults | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setResults(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile)
      setError(null)
      setResults(null)
    } else if (droppedFile) {
      setError('Solo se permiten archivos Excel (.xlsx, .xls)')
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setError(null)
    setResults(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
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
        setError(data.error || 'Error al importar Excel')
        return
      }

      setResults(data.results)
    } catch {
      setError('Error al subir el archivo')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setError(null)
    setResults(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const getImportMessage = () => {
    if (!results) return null

    const totalCreated = results.alumnos.created + results.clases.created + results.pagos.created
    const totalUpdated = results.alumnos.updated
    const totalErrors = results.alumnos.errors + results.clases.errors + results.pagos.errors

    if (totalCreated === 0 && totalUpdated === 0 && totalErrors === 0) {
      return {
        type: 'warning' as const,
        title: 'No se encontraron datos válidos',
        message: 'La IA no pudo extraer información del archivo Excel. Verifica que el formato sea correcto y que los datos estén bien estructurados.'
      }
    }

    if (totalCreated > 0 && totalUpdated > 0 && totalErrors === 0) {
      return {
        type: 'success' as const,
        title: 'Importación completada con éxito',
        message: `Se crearon ${totalCreated} registros y se actualizaron ${totalUpdated} alumnos: ${results.alumnos.created} alumnos nuevos, ${results.alumnos.updated} alumnos actualizados, ${results.clases.created} clases, ${results.pagos.created} pagos.`
      }
    }

    if (totalCreated > 0 && totalUpdated === 0 && totalErrors === 0) {
      return {
        type: 'success' as const,
        title: 'Importación completada con éxito',
        message: `Se importaron ${totalCreated} registros: ${results.alumnos.created} alumnos, ${results.clases.created} clases, ${results.pagos.created} pagos.`
      }
    }

    if (totalCreated === 0 && totalUpdated > 0 && totalErrors === 0) {
      return {
        type: 'success' as const,
        title: 'Actualización completada',
        message: `Se actualizaron ${totalUpdated} alumnos existentes.`
      }
    }

    if ((totalCreated > 0 || totalUpdated > 0) && totalErrors > 0) {
      const errorDetails = [
        ...results.alumnos.errorDetails,
        ...results.clases.errorDetails,
        ...results.pagos.errorDetails
      ].join('\n')

      return {
        type: 'warning' as const,
        title: 'Importación parcial',
        message: `Se procesaron ${totalCreated + totalUpdated} registros (${totalCreated} nuevos, ${totalUpdated} actualizados), pero ${totalErrors} fallaron: ${results.alumnos.errors} alumnos, ${results.clases.errors} clases, ${results.pagos.errors} pagos.\n\nErrores:\n${errorDetails}`
      }
    }

    if (totalErrors > 0) {
      const errorDetails = [
        ...results.alumnos.errorDetails,
        ...results.clases.errorDetails,
        ...results.pagos.errorDetails
      ].join('\n')

      return {
        type: 'error' as const,
        title: 'Error en la importación',
        message: `No se pudo importar ningún registro. ${totalErrors} errores: ${results.alumnos.errors} alumnos, ${results.clases.errors} clases, ${results.pagos.errors} pagos.\n\nErrores:\n${errorDetails}`
      }
    }

    return null
  }

  const importMessage = getImportMessage()

  const footer = results ? (
    <button onClick={handleClose} className="btn-primary">
      Cerrar
    </button>
  ) : (
    <>
      <button onClick={handleClose} className="btn-ghost" disabled={isUploading}>
        Cancelar
      </button>
      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="btn-primary"
      >
        {isUploading ? 'Procesando...' : 'Importar'}
      </button>
    </>
  )

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={handleClose}
      title="Importar Datos desde Excel"
      description="Selecciona un archivo Excel para importar alumnos, clases y pagos"
      footer={footer}
      size="md"
    >
      <div className="space-y-4">
        <div className="form-group">
          <label className="form-label">Seleccionar archivo Excel</label>
          
          {!file ? (
            <div
              className={`file-drop-zone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="file-drop-content">
                <div className="file-drop-icon">
                  <Upload size={32} />
                </div>
                <div className="file-drop-text">
                  <p className="file-drop-title">Arrastra tu archivo Excel aquí</p>
                  <p className="file-drop-subtitle">o haz clic para seleccionar</p>
                </div>
                <div className="file-drop-formats">
                  <FileSpreadsheet size={14} />
                  <span>.xlsx, .xls</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="file-selected">
              <div className="file-selected-info">
                <div className="file-selected-icon">
                  <FileSpreadsheet size={24} />
                </div>
                <div className="file-selected-details">
                  <p className="file-selected-name">{file.name}</p>
                  <p className="file-selected-size">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <button
                onClick={handleRemoveFile}
                className="file-selected-remove"
                disabled={isUploading}
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="form-message error" role="alert">
            {error}
          </div>
        )}

        {importMessage && (
          <div className={`form-message ${importMessage.type}`} role="alert">
            <div className="space-y-2">
              <div className="font-semibold">{importMessage.title}</div>
              <div className="text-sm">{importMessage.message}</div>
            </div>
          </div>
        )}
      </div>
    </DialogBase>
  )
}
