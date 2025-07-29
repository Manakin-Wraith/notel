import React from 'react';
import { useAuthWithToast } from '../../hooks/useAuthWithToast';

const HeroSection: React.FC = () => {
  const { signInWithGoogle, isAuthLoading } = useAuthWithToast();

  const handleGetStarted = async () => {
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
    <section className="relative py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Your thoughts, organized.
            <br />
            <span className="text-blue-400">Your productivity, amplified.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            The workspace that adapts to how you think. Write, plan, organize, and achieve more 
            with Notel's clean, distraction-free interface.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button 
              onClick={handleGetStarted}
              disabled={isAuthLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isAuthLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Starting...</span>
                </>
              ) : (
                'Start for Free'
              )}
            </button>
            <button className="border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
              Watch Demo
            </button>
          </div>

          {/* Hero Visual Placeholder */}
          <div className="relative max-w-5xl mx-auto">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 shadow-2xl">
              <div className="bg-gray-900 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                  <div className="h-8 bg-gray-800 rounded mt-6"></div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="h-16 bg-gray-800 rounded"></div>
                    <div className="h-16 bg-gray-800 rounded"></div>
                    <div className="h-16 bg-gray-800 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
