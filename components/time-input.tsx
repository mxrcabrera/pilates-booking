'use client'

import { Clock } from 'lucide-react'

interface TimeInputProps {
  name: string
  value?: string
  defaultValue?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  required?: boolean
  className?: string
}

export function TimeInput({
  name,
  value,
  defaultValue,
  onChange,
  disabled,
  required = true,
  className = ''
}: TimeInputProps) {
  return (
    <div className="time-input-wrapper">
      <input
        type="time"
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`time-input-custom ${className}`}
      />
      <Clock size={18} className="time-input-icon" />
    </div>
  )
}
