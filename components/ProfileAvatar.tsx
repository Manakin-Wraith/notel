import React from 'react'
import { ProfileService } from '../lib/profiles'

interface ProfileAvatarProps {
  displayName: string | null
  avatarUrl: string | null
  size?: 'small' | 'medium' | 'large'
  className?: string
  onClick?: () => void
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  displayName,
  avatarUrl,
  size = 'medium',
  className = '',
  onClick
}) => {
  const sizeClasses = {
    small: 'w-6 h-6 text-xs',
    medium: 'w-8 h-8 text-sm',
    large: 'w-12 h-12 text-base'
  }

  const initials = ProfileService.generateInitials(displayName)
  const backgroundColor = ProfileService.generateAvatarColor(displayName)

  const baseClasses = `
    flex items-center justify-center rounded-full font-medium text-white
    ${sizeClasses[size]}
    ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
    ${className}
  `

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName || 'User avatar'}
        className={`${baseClasses} object-cover`}
        onClick={onClick}
        onError={(e) => {
          // Fallback to initials if image fails to load
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          const parent = target.parentElement
          if (parent) {
            parent.innerHTML = initials
            parent.style.backgroundColor = backgroundColor
          }
        }}
      />
    )
  }

  return (
    <div
      className={baseClasses}
      style={{ backgroundColor }}
      onClick={onClick}
    >
      {initials}
    </div>
  )
}

export default ProfileAvatar
