'use client'

import { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
  className?: string
  htmlFor?: string
}

export function FormField({
  label,
  error,
  hint,
  required,
  children,
  className = '',
  htmlFor
}: FormFieldProps) {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined

  return (
    <div className={`form-group ${error ? 'has-error' : ''} ${className}`}>
      <label htmlFor={htmlFor}>
        {label}
        {required && <span className="form-required">*</span>}
      </label>
      {children}
      {hint && !error && <p className="form-hint">{hint}</p>}
      {error && <FormError message={error} id={errorId} />}
    </div>
  )
}

interface FormErrorProps {
  message?: string
  id?: string
}

export function FormError({ message, id }: FormErrorProps) {
  if (!message) return null

  return (
    <p className="form-error" id={id} role="alert">{message}</p>
  )
}

interface FormMessageProps {
  type: 'success' | 'error'
  message: string
}

export function FormMessage({ type, message }: FormMessageProps) {
  return (
    <div className={`form-message ${type}`}>
      {message}
    </div>
  )
}
