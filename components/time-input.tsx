'use client'

import { useRef } from 'react'
import { Clock } from 'lucide-react'

interface TimeInputProps {
  id?: string
  name: string
  value?: string
  defaultValue?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  required?: boolean
  className?: string
}

export function TimeInput({
  id,
  name,
  value,
  defaultValue,
  onChange,
  disabled,
  required = true,
  className = ''
}: TimeInputProps) {
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
        type="time"
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`input-with-icon time-input ${className}`}
      />
      <Clock
        size={18}
        className="input-icon"
        onClick={handleIconClick}
        style={{ cursor: disabled ? 'default' : 'pointer' }}
      />
    </div>
  )
}
