import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Simple toast notification function
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white font-medium transition-all duration-300 transform translate-x-full opacity-0 ${
    type === 'success' ? 'bg-green-600' : 'bg-red-600'
  }`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-x-full', 'opacity-0');
  }, 100);
  
  // Animate out and remove
  setTimeout(() => {
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
};

export const useAuthWithToast = () => {
  const { signInWithGoogle, ...authContext } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const signInWithGoogleEnhanced = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        showToast('Unable to sign in with Google. Please try again.', 'error');
        console.error('Authentication error:', error);
        return { error };
      } else {
        showToast('Welcome to Notel! Successfully signed in.', 'success');
        return { error: null };
      }
    } catch (error) {
      showToast('Network error occurred. Please check your connection.', 'error');
      console.error('Authentication failed:', error);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    ...authContext,
    signInWithGoogle: signInWithGoogleEnhanced,
    isAuthLoading: isLoading,
  };
};
