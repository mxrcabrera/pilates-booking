'use client'

import { useRef } from 'react'
import { Calendar } from 'lucide-react'

interface DateInputProps {
  id?: string
  name: string
  value?: string
  defaultValue?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  required?: boolean
  min?: string
  max?: string
  className?: string
}

export function DateInput({
  id,
  name,
  value,
  defaultValue,
  onChange,
  disabled,
  required = true,
  min,
  max,
  className = ''
}: DateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleIconClick = () => {
    if (inputRef.current && !disabled) {
      inputRef.current.showPicker()
    }
  }

  return (
    <div className="input-with-icon-wrapper">
      <input
        ref={inputRef}
        id={id}
        type="date"
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        disabled={disabled}
        required={required}
        min={min}
        max={max}
        className={`input-with-icon date-input ${className}`}
      />
      <Calendar
        size={18}
        className="input-icon"
        onClick={handleIconClick}
        style={{ cursor: disabled ? 'default' : 'pointer' }}
      />
    </div>
  )
}
