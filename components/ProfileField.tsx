import React, { useState, useEffect, useRef } from 'react'

interface ProfileFieldProps {
  label: string
  value: string | null
  placeholder?: string
  type?: 'text' | 'email' | 'url' | 'textarea'
  maxLength?: number
  onSave: (value: string) => Promise<void>
  disabled?: boolean
  className?: string
}

const ProfileField: React.FC<ProfileFieldProps> = ({
  label,
  value,
  placeholder,
  type = 'text',
  maxLength,
  onSave,
  disabled = false,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    setEditValue(value || '')
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if (type !== 'textarea') {
        inputRef.current.select()
      }
    }
  }, [isEditing, type])

  const handleEdit = () => {
    if (disabled) return
    setIsEditing(true)
    setError(null)
  }

  const handleCancel = () => {
    setEditValue(value || '')
    setIsEditing(false)
    setError(null)
  }

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await onSave(editValue.trim())
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const displayValue = value || placeholder || 'Add ' + label.toLowerCase()
  const isEmpty = !value

  if (isEditing) {
    const InputComponent = type === 'textarea' ? 'textarea' : 'input'
    
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide">
          {label}
        </label>
        
        <div className="space-y-2">
          <InputComponent
            ref={inputRef as any}
            type={type === 'textarea' ? undefined : type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            maxLength={maxLength}
            disabled={isSaving}
            className={`
              w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md
              text-white placeholder-gray-400 text-sm
              focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              ${type === 'textarea' ? 'resize-none min-h-[80px]' : ''}
            `}
            placeholder={placeholder}
            rows={type === 'textarea' ? 3 : undefined}
          />
          
          {error && (
            <div className="text-xs text-red-400 flex items-center space-x-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          
          {isSaving && (
            <div className="text-xs text-gray-400 flex items-center space-x-1">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Saving...</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide">
        {label}
      </label>
      
      <div
        onClick={handleEdit}
        className={`
          px-3 py-2 rounded-md text-sm cursor-pointer transition-colors
          ${isEmpty 
            ? 'text-gray-500 hover:text-gray-400 hover:bg-gray-800/50 border border-dashed border-gray-600' 
            : 'text-white hover:bg-gray-800/50 border border-transparent'
          }
          ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        `}
      >
        {displayValue}
      </div>
    </div>
  )
}

export default ProfileField
