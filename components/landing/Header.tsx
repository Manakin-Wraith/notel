import React, { useState } from 'react';
import Auth from '../Auth';

const Header: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleEmailSignUp = () => {
    setShowAuthModal(true);
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
              onClick={handleEmailSignUp}
              className="text-gray-300 hover:text-white transition-colors mr-4"
            >
              Log In
            </button>
            <button 
              onClick={handleEmailSignUp}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
      
      {/* Email Signup Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#111111] p-6 rounded-lg max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            <Auth />
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
