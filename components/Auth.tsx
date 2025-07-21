import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const { signIn, signUp } = useAuth()

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

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
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
                className="mt-1 block w-full px-3 py-2 bg-black/30 border border-white/10 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
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
                className="mt-1 block w-full px-3 py-2 bg-black/30 border border-white/10 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>
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

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setMessage('')
              }}
              className="text-purple-400 hover:text-purple-300 text-sm"
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"
              }
            </button>
          </div>
        </form>

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
