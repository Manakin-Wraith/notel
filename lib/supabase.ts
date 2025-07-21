import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = 'https://yoqcitfxarpbfldxanhi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvcWNpdGZ4YXJwYmZsZHhhbmhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTg0NzUsImV4cCI6MjA2ODY3NDQ3NX0.Q3SxNvRoqxPC8M2XU1KqspQEUMezoggQSF_fjewGZio'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return !!user
}

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
