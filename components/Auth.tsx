import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import GoogleIcon from './icons/GoogleIcon'

const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [message, setMessage] = useState('')

  const { signIn, signUp, signInWithGoogle } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password)

      if (error) {
        setMessage(error.message)
      } else if (isSignUp) {
        setMessage('Check your email for the confirmation link!')
      }
    } catch (error) {
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setMessage('')

    try {
      const { error } = await signInWithGoogle()
      if (error) {
        setMessage(error.message)
      }
    } catch (error) {
      setMessage('Failed to sign in with Google')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111111] px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-200">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <p className="mt-2 text-gray-400">
            {isSignUp 
              ? 'Sign up to sync your notes across devices' 
              : 'Welcome back to Notel'
            }
          </p>
        </div>

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
          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-gray-900 rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 hover:border-gray-300"
          >
            <GoogleIcon size={20} />
            {googleLoading ? 'Signing in...' : `${isSignUp ? 'Sign up' : 'Sign in'} with Google`}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#111111] text-gray-400">or</span>
            </div>
          </div>

          {/* Email Sign-In Button */}
          <button
            onClick={() => setShowEmailForm(!showEmailForm)}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-800/50 hover:bg-gray-800/70 text-gray-300 rounded-lg transition-all duration-200 font-medium border border-gray-700 hover:border-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {isSignUp ? 'Sign up' : 'Sign in'} with email
          </button>
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
