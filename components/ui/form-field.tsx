'use client'

import React, { ReactNode, isValidElement, cloneElement, ReactElement } from 'react'

interface FormFieldProps {
  label: string
  error?: string
  hint?: ReactNode
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

  const enhancedChildren = error && isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        'aria-invalid': true,
        ...(errorId && { 'aria-describedby': errorId }),
      })
    : children

  return (
    <div className={`form-group ${error ? 'has-error' : ''} ${className}`}>
      <label htmlFor={htmlFor}>
        {label}
        {required && <span className="form-required">*</span>}
      </label>
      {enhancedChildren}
      {hint && !error && <div className="form-hint">{hint}</div>}
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
