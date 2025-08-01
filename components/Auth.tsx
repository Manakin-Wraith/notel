import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const { signIn, signUp, signOut, user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Validation: Ensure email and password are provided
    if (!email.trim()) {
      setMessage('Please enter your email address')
      setLoading(false)
      return
    }

    if (!password.trim()) {
      setMessage('Please enter your password')
      setLoading(false)
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setMessage('Please enter a valid email address')
      setLoading(false)
      return
    }

    // Password length validation for signup
    if (isSignUp && password.length < 6) {
      setMessage('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password)

      if (error) {
        setMessage(error.message)
      } else if (isSignUp) {
        setMessage('✅ Account created! Check your email and click the confirmation link to sign in.')
      }
    } catch (error) {
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }



  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111111] px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-200">
            {isSignUp ? 'Create Account' : 'Log In'}
          </h2>
          <p className="mt-2 text-gray-400">
            {isSignUp 
              ? 'Enter your email and password to get started' 
              : 'Welcome back to Notel'
            }
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Works with any email provider - Gmail, Yahoo, Outlook, and more
          </p>
        </div>

        {/* Temporary: Show sign-out option if already authenticated */}
        {user && (
          <div className="p-3 rounded-md bg-blue-900/20 text-blue-400 border border-blue-500/20">
            <p className="text-sm mb-2">🚨 You're already signed in! To test new user flow:</p>
            <div className="space-y-2">
              <button
                onClick={async () => {
                  await signOut()
                  // Force clear all browser storage
                  localStorage.clear()
                  sessionStorage.clear()
                  // Clear any Supabase cached data
                  if (typeof window !== 'undefined') {
                    const keys = Object.keys(localStorage)
                    keys.forEach(key => {
                      if (key.includes('supabase') || key.includes('auth')) {
                        localStorage.removeItem(key)
                      }
                    })
                  }
                  setMessage('✅ Session cleared! Refresh page to test new user flow.')
                  // Force page reload after short delay
                  setTimeout(() => {
                    window.location.reload()
                  }, 1500)
                }}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors mr-2"
              >
                🧹 Nuclear Sign Out & Reload
              </button>
              <button
                onClick={async () => {
                  await signOut()
                  setMessage('')
                }}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
              >
                Regular Sign Out
              </button>
            </div>
          </div>
        )}

        {message && (
          <div className={`p-3 rounded-md text-sm ${
            message.includes('Check your email') 
              ? 'bg-green-900/20 text-green-400 border border-green-500/20' 
              : 'bg-red-900/20 text-red-400 border border-red-500/20'
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-4">
          {/* Show form immediately for reduced friction */}
          {!showEmailForm && (
            <button
              onClick={() => setShowEmailForm(true)}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {isSignUp ? 'Get Started' : 'Log In'}
            </button>
          )}
        </div>

        {/* Email Form */}
        {showEmailForm && (
          <form className="space-y-4 animate-in slide-in-from-top-2 duration-200" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowEmailForm(false)
                  setEmail('')
                  setPassword('')
                  setMessage('')
                }}
                className="flex-1 py-2.5 px-4 text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 rounded-lg transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 font-medium"
              >
                {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </button>
            </div>
          </form>
        )}

        {/* Toggle Sign Up/Sign In */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setMessage('')
              setShowEmailForm(false)
              setEmail('')
              setPassword('')
            }}
            className="text-purple-400 hover:text-purple-300 text-sm transition-colors duration-200"
          >
            {isSignUp 
              ? 'Already have an account? Sign in' 
              : "Don't have an account? Sign up"
            }
          </button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Your data will be securely stored and synced across all your devices
          </p>
        </div>
      </div>
    </div>
  )
}

export default Auth
