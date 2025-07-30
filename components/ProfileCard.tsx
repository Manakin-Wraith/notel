import React from 'react'
import ProfileAvatar from './ProfileAvatar'
import { UserProfile } from '../lib/profiles'

interface ProfileCardProps {
  profile: UserProfile | null
  userEmail: string | null
  onClick?: () => void
  className?: string
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  userEmail,
  onClick,
  className = ''
}) => {
  const displayName = profile?.display_name || userEmail?.split('@')[0] || 'User'
  
  return (
    <div
      className={`
        flex items-center space-x-3 p-3 rounded-md
        hover:bg-white/5 transition-colors cursor-pointer
        ${className}
      `}
      onClick={onClick}
    >
      <ProfileAvatar
        displayName={displayName}
        avatarUrl={profile?.avatar_url || null}
        size="medium"
      />
      
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">
          {displayName}
        </div>
        {profile?.bio && (
          <div className="text-xs text-gray-400 truncate">
            {profile.bio}
          </div>
        )}
      </div>
      
      {/* Chevron indicator */}
      <svg 
        className="w-4 h-4 text-gray-400" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M9 5l7 7-7 7" 
        />
      </svg>
    </div>
  )
}

export default ProfileCard
