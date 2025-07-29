import React from 'react';
import { useAuthWithToast } from '../../hooks/useAuthWithToast';

const Header: React.FC = () => {
  const { signInWithGoogle, isAuthLoading } = useAuthWithToast();

  const handleAuthClick = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('Authentication error:', error);
      }
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/ntl_logo.png" 
              alt="Notel" 
              className="h-8 w-auto"
            />
            <span className="ml-3 text-2xl font-bold text-white">
              Notel
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">
              Features
            </a>
            <a href="#benefits" className="text-gray-300 hover:text-white transition-colors">
              Benefits
            </a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">
              Pricing
            </a>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleAuthClick}
              disabled={isAuthLoading}
              className="text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAuthLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
            <button 
              onClick={handleAuthClick}
              disabled={isAuthLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isAuthLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Getting Started...</span>
                </>
              ) : (
                'Get Started'
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
