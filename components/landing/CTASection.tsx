import React from 'react';
import { useAuthWithToast } from '../../hooks/useAuthWithToast';

const CTASection: React.FC = () => {
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
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to transform your productivity?
        </h2>
        <p className="text-xl text-gray-300 mb-8">
          Join thousands of users who have already made the switch to a cleaner, 
          more organized workspace.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
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
              'Start Free Today'
            )}
          </button>
          <button className="border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
            Schedule Demo
          </button>
        </div>

        <div className="text-sm text-gray-400">
          No credit card required • Free forever • Setup in 2 minutes
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-2xl font-bold text-white">10,000+</div>
              <div className="text-gray-300">Active Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">99.9%</div>
              <div className="text-gray-300">Uptime</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">4.8/5</div>
              <div className="text-gray-300">User Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
