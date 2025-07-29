import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import LandingPage from '../../components/landing/LandingPage';
import { AuthProvider } from '../../contexts/AuthContext';
import { NotificationProvider } from '../../contexts/NotificationContext';

// Mock the auth context
const mockSignInWithGoogle = vi.fn();
const mockUseAuth = {
  user: null,
  session: null,
  loading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signInWithGoogle: mockSignInWithGoogle,
  signOut: vi.fn(),
};

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../contexts/NotificationContext', () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
    },
  },
}));

const renderLandingPage = () => {
  const mockNavigateToEvent = vi.fn();
  return render(
    <AuthProvider>
      <NotificationProvider onNavigateToEvent={mockNavigateToEvent}>
        <LandingPage />
      </NotificationProvider>
    </AuthProvider>
  );
};

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the landing page with all sections', () => {
      renderLandingPage();
      
      // Check for main sections
      expect(screen.getAllByText('Notel')).toHaveLength(3); // Header, Footer, and another section
      expect(screen.getByText('Your thoughts, organized.')).toBeInTheDocument();
      expect(screen.getByText('Your productivity, amplified.')).toBeInTheDocument();
      expect(screen.getByText('Everything you need to stay productive')).toBeInTheDocument();
      expect(screen.getByText('Why choose Notel?')).toBeInTheDocument();
      expect(screen.getByText('Ready to transform your productivity?')).toBeInTheDocument();
    });

    it('should render all auth buttons', () => {
      renderLandingPage();
      
      // Header buttons
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument();
      
      // Hero section button
      expect(screen.getByRole('button', { name: 'Start for Free' })).toBeInTheDocument();
      
      // CTA section button
      expect(screen.getByRole('button', { name: 'Start Free Today' })).toBeInTheDocument();
    });

    it('should render feature showcase with all features', () => {
      renderLandingPage();
      
      expect(screen.getByText('Write & Organize')).toBeInTheDocument();
      expect(screen.getByText('Plan & Schedule')).toBeInTheDocument();
      expect(screen.getByText('Track & Manage')).toBeInTheDocument();
      expect(screen.getByText('Stay Focused')).toBeInTheDocument();
    });

    it('should render benefits section with comparison', () => {
      renderLandingPage();
      
      expect(screen.getByText('Unified Workspace')).toBeInTheDocument();
      expect(screen.getByText('Flexible Views')).toBeInTheDocument();
      expect(screen.getByText('Smart Notifications')).toBeInTheDocument();
      expect(screen.getByText('Beautiful Design')).toBeInTheDocument();
      expect(screen.getByText('Notel vs Others')).toBeInTheDocument();
    });
  });

  describe('Google OAuth Integration', () => {
    it('should call signInWithGoogle when Sign In button is clicked', async () => {
      mockSignInWithGoogle.mockResolvedValue({ error: null });
      renderLandingPage();
      
      const signInButton = screen.getByRole('button', { name: 'Sign In' });
      fireEvent.click(signInButton);
      
      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
      });
    });

    it('should call signInWithGoogle when Get Started button is clicked', async () => {
      mockSignInWithGoogle.mockResolvedValue({ error: null });
      renderLandingPage();
      
      const getStartedButton = screen.getByRole('button', { name: 'Get Started' });
      fireEvent.click(getStartedButton);
      
      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
      });
    });

    it('should call signInWithGoogle when Start for Free button is clicked', async () => {
      mockSignInWithGoogle.mockResolvedValue({ error: null });
      renderLandingPage();
      
      const startFreeButton = screen.getByRole('button', { name: 'Start for Free' });
      fireEvent.click(startFreeButton);
      
      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
      });
    });

    it('should call signInWithGoogle when Start Free Today button is clicked', async () => {
      mockSignInWithGoogle.mockResolvedValue({ error: null });
      renderLandingPage();
      
      const startTodayButton = screen.getByRole('button', { name: 'Start Free Today' });
      fireEvent.click(startTodayButton);
      
      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const authError = new Error('Authentication failed');
      mockSignInWithGoogle.mockResolvedValue({ error: authError });
      
      renderLandingPage();
      
      const signInButton = screen.getByRole('button', { name: 'Sign In' });
      fireEvent.click(signInButton);
      
      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith('Authentication error:', authError);
      });
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle network errors during authentication', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSignInWithGoogle.mockRejectedValue(new Error('Network error'));
      
      renderLandingPage();
      
      const signInButton = screen.getByRole('button', { name: 'Sign In' });
      fireEvent.click(signInButton);
      
      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith('Authentication failed:', expect.any(Error));
      });
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Navigation', () => {
    it('should render navigation links', () => {
      renderLandingPage();
      
      expect(screen.getAllByRole('link', { name: 'Features' })).toHaveLength(2); // Header + Footer
      expect(screen.getAllByRole('link', { name: 'Benefits' })).toHaveLength(1); // Header only
      expect(screen.getAllByRole('link', { name: 'Pricing' })).toHaveLength(1); // Header only
    });

    it('should have correct href attributes for navigation', () => {
      renderLandingPage();
      
      const featuresLinks = screen.getAllByRole('link', { name: 'Features' });
      
      expect(featuresLinks[0]).toHaveAttribute('href', '#features'); // Header link
      expect(screen.getByRole('link', { name: 'Benefits' })).toHaveAttribute('href', '#benefits');
      expect(screen.getByRole('link', { name: 'Pricing' })).toHaveAttribute('href', '#pricing');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderLandingPage();
      
      // Main heading
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      
      // Section headings
      const h2Headings = screen.getAllByRole('heading', { level: 2 });
      expect(h2Headings.length).toBeGreaterThan(0);
      
      // Feature headings
      const h3Headings = screen.getAllByRole('heading', { level: 3 });
      expect(h3Headings.length).toBeGreaterThan(0);
    });

    it('should have accessible button labels', () => {
      renderLandingPage();
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });
  });
});
