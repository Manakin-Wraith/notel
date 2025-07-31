import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { UserProfile, ProfileService } from '../lib/profiles'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  profileLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signInWithGoogle: () => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  updateProfile: (profile: UserProfile) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Load user profile when user signs in
      if (session?.user) {
        await loadUserProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    // Use production URL for email confirmation redirects
    const redirectTo = import.meta.env.PROD 
      ? 'https://notel-wine.vercel.app/'
      : 'http://localhost:5173/'
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo
      }
    })
    return { error }
  }

  const signInWithGoogle = async () => {
    try {
      // Try popup mode first (better UX - keeps main app accessible)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: import.meta.env.PROD 
            ? 'https://notel-wine.vercel.app/'
            : 'http://localhost:5173/',
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account'
          },
          skipBrowserRedirect: true // Use popup mode
        }
      })
      
      if (error) {
        // Fallback to redirect mode if popup fails
        console.log('Popup failed, trying redirect mode:', error)
        const { error: redirectError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: import.meta.env.PROD 
              ? 'https://notel-wine.vercel.app/'
              : 'http://localhost:5173/',
            queryParams: {
              access_type: 'offline',
              prompt: 'select_account'
            },
            skipBrowserRedirect: false // Fallback to redirect
          }
        })
        return { error: redirectError }
      }
      
      return { error }
    } catch (err) {
      console.error('Google OAuth error:', err)
      return { error: err }
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    setProfile(null) // Clear profile on sign out
    return { error }
  }

  // Load user profile
  const loadUserProfile = async (userId: string) => {
    setProfileLoading(true)
    try {
      const { data, error } = await ProfileService.getUserProfile(userId)
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading profile:', error)
        return
      }
      
      // If no profile exists, create one
      if (!data) {
        const { data: newProfile, error: createError } = await ProfileService.createUserProfile(userId, {
          display_name: user?.email?.split('@')[0] || null
        })
        
        if (createError) {
          console.error('Error creating profile:', createError)
        } else {
          setProfile(newProfile)
        }
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  // Update profile in context
  const updateProfile = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile)
  }

  // Load profile when user is available
  useEffect(() => {
    if (user && !profile && !profileLoading) {
      loadUserProfile(user.id)
    }
  }, [user, profile, profileLoading])

  const value = {
    user,
    session,
    profile,
    loading,
    profileLoading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
