import React, { useState, useRef } from 'react'
import ProfileAvatar from './ProfileAvatar'
import ProfileField from './ProfileField'
import { UserProfile, ProfileService, ProfileUpdateData } from '../lib/profiles'
import { useAuth } from '../contexts/AuthContext'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  profile: UserProfile | null
  onProfileUpdate: (profile: UserProfile) => void
}

const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdate
}) => {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen || !user) return null

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'User'

  const handleFieldSave = async (field: keyof ProfileUpdateData, value: string) => {
    if (!user) return

    try {
      const updates = { [field]: value || null }
      const { data, error } = await ProfileService.updateUserProfile(user.id, updates)
      
      if (error) throw new Error(error.message)
      if (data) onProfileUpdate(data)
    } catch (error) {
      throw new Error(`Failed to update ${field}`)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    if (!user) return

    setIsUploading(true)
    setUploadError(null)

    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file')
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Image must be smaller than 5MB')
      }

      // Delete old avatar if exists
      if (profile?.avatar_url) {
        await ProfileService.deleteAvatar(profile.avatar_url)
      }

      // Upload new avatar
      const { data: uploadData, error: uploadError } = await ProfileService.uploadAvatar(user.id, file)
      if (uploadError) throw new Error(uploadError.message)

      // Update profile with new avatar URL
      const { data, error } = await ProfileService.updateUserProfile(user.id, {
        avatar_url: uploadData?.url
      })
      
      if (error) throw new Error(error.message)
      if (data) onProfileUpdate(data)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload avatar')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!user || !profile?.avatar_url) return

    try {
      // Delete avatar file
      await ProfileService.deleteAvatar(profile.avatar_url)
      
      // Update profile to remove avatar URL
      const { data, error } = await ProfileService.updateUserProfile(user.id, {
        avatar_url: null
      })
      
      if (error) throw new Error(error.message)
      if (data) onProfileUpdate(data)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to remove avatar')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleAvatarUpload(file)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <ProfileAvatar
                displayName={displayName}
                avatarUrl={profile?.avatar_url || null}
                size="large"
                className="ring-2 ring-gray-600"
              />
              
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {profile?.avatar_url ? 'Change' : 'Upload'} Photo
              </button>
              
              {profile?.avatar_url && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={isUploading}
                  className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white border border-gray-600 hover:border-gray-500 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Remove
                </button>
              )}
            </div>

            {uploadError && (
              <div className="text-xs text-red-400 text-center">{uploadError}</div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Profile Fields */}
          <div className="space-y-4">
            <ProfileField
              label="Display Name"
              value={profile?.display_name}
              placeholder="Your display name"
              maxLength={50}
              onSave={(value) => handleFieldSave('display_name', value)}
            />

            <ProfileField
              label="Bio"
              value={profile?.bio}
              placeholder="Tell us about yourself"
              type="textarea"
              maxLength={200}
              onSave={(value) => handleFieldSave('bio', value)}
            />

            <ProfileField
              label="Job Title"
              value={profile?.job_title}
              placeholder="Your job title"
              maxLength={100}
              onSave={(value) => handleFieldSave('job_title', value)}
            />

            <ProfileField
              label="Location"
              value={profile?.location}
              placeholder="Your location"
              maxLength={100}
              onSave={(value) => handleFieldSave('location', value)}
            />

            <ProfileField
              label="Website"
              value={profile?.website}
              placeholder="https://yourwebsite.com"
              type="url"
              maxLength={200}
              onSave={(value) => handleFieldSave('website', value)}
            />

            <ProfileField
              label="Timezone"
              value={profile?.timezone}
              placeholder="UTC"
              onSave={(value) => handleFieldSave('timezone', value)}
            />
          </div>

          {/* Account Info */}
          <div className="pt-4 border-t border-gray-700">
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Account
              </div>
              <div className="text-sm text-gray-300">
                {user.email}
              </div>
              {profile?.created_at && (
                <div className="text-xs text-gray-500">
                  Member since {new Date(profile.created_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileModal
