import { supabase } from './supabase'

export interface UserProfile {
  id: string
  user_id: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  timezone: string
  job_title: string | null
  location: string | null
  website: string | null
  created_at: string
  updated_at: string
}

export interface ProfileUpdateData {
  display_name?: string | null
  bio?: string | null
  avatar_url?: string | null
  timezone?: string
  job_title?: string | null
  location?: string | null
  website?: string | null
}

export class ProfileService {
  // Get user profile
  static async getUserProfile(userId: string): Promise<{ data: UserProfile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Create user profile
  static async createUserProfile(userId: string, profileData: Partial<ProfileUpdateData>): Promise<{ data: UserProfile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          ...profileData
        })
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: ProfileUpdateData): Promise<{ data: UserProfile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Upload avatar image
  static async uploadAvatar(userId: string, file: File): Promise<{ data: { url: string } | null; error: any }> {
    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        return { data: null, error: uploadError }
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return { data: { url: publicUrl }, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Delete avatar
  static async deleteAvatar(avatarUrl: string): Promise<{ error: any }> {
    try {
      // Extract file path from URL
      const urlParts = avatarUrl.split('/')
      const fileName = urlParts[urlParts.length - 1]
      const filePath = `avatars/${fileName}`

      const { error } = await supabase.storage
        .from('avatars')
        .remove([filePath])

      return { error }
    } catch (error) {
      return { error }
    }
  }

  // Generate initials from name
  static generateInitials(name: string | null): string {
    if (!name) return '?'
    
    const words = name.trim().split(' ')
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase()
    }
    
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
  }

  // Generate color from name for avatar background
  static generateAvatarColor(name: string | null): string {
    if (!name) return '#6B7280' // gray-500
    
    const colors = [
      '#EF4444', // red-500
      '#F97316', // orange-500
      '#F59E0B', // amber-500
      '#EAB308', // yellow-500
      '#84CC16', // lime-500
      '#22C55E', // green-500
      '#10B981', // emerald-500
      '#14B8A6', // teal-500
      '#06B6D4', // cyan-500
      '#0EA5E9', // sky-500
      '#3B82F6', // blue-500
      '#6366F1', // indigo-500
      '#8B5CF6', // violet-500
      '#A855F7', // purple-500
      '#D946EF', // fuchsia-500
      '#EC4899', // pink-500
      '#F43F5E', // rose-500
    ]
    
    // Generate consistent color based on name
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    return colors[Math.abs(hash) % colors.length]
  }
}
