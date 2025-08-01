// Quick script to create a test user for chat testing
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yoqcitfxarpbfldxanhi.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvcWNpdGZ4YXJwYmZsZHhhbmhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5ODQ3NSwiZXhwIjoyMDY4Njc0NDc1fQ.HzvhMlRwMtbh8KZ5lKrgciuUomPUV3emnhrHkyUdY_g'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestUser() {
  try {
    console.log('Creating test user...')
    
    // Create test user with email/password
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'testuser@example.com',
      password: 'testpass123',
      email_confirm: true, // Skip email verification
      user_metadata: {
        name: 'Test User'
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return
    }

    console.log('✅ Test user created successfully!')
    console.log('📧 Email: testuser@example.com')
    console.log('🔑 Password: testpass123')
    console.log('🆔 User ID:', authData.user.id)

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: 'testuser@example.com',
        name: 'Test User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.warn('Profile creation error (might already exist):', profileError)
    } else {
      console.log('✅ User profile created!')
    }

    console.log('\n🚀 You can now sign in with:')
    console.log('Email: testuser@example.com')
    console.log('Password: testpass123')
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

createTestUser()
