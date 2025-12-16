'use client'

import { ChevronDown } from 'lucide-react'

interface SelectInputProps {
  name?: string
  value?: string
  defaultValue?: string
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  disabled?: boolean
  required?: boolean
  className?: string
  children: React.ReactNode
}

export function SelectInput({
  name,
  value,
  defaultValue,
  onChange,
  disabled,
  required,
  className = '',
  children
}: SelectInputProps) {
  return (
    <div className="input-with-icon-wrapper">
      <select
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`input-with-icon select-input ${className}`}
      >
        {children}
      </select>
      <ChevronDown size={18} className="input-icon" />
    </div>
  )
}
