import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import Router from '../../components/Router';
import { AuthProvider } from '../../contexts/AuthContext';
import { NotificationProvider } from '../../contexts/NotificationContext';

// Mock user helper
const createMockUser = () => ({
  id: 'user-123',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {},
  identities: []
} as any);

// Mock useAuth hook
const mockUseAuth = {
  user: null,
  session: null,
  loading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
};

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../contexts/NotificationContext', () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock landing page components
vi.mock('../../components/landing/LandingPage', () => ({
  default: () => <div data-testid="landing-page">Landing Page</div>,
}));

vi.mock('../../components/SharedContentViewer', () => ({
  default: ({ shareId, resourceType }: { shareId: string; resourceType: string }) => (
    <div data-testid="shared-content-viewer">
      Shared Content: {resourceType} - {shareId}
    </div>
  ),
}));

// Mock window.location
const mockLocation = {
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: '',
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

const renderRouter = (children: React.ReactNode = <div data-testid="main-app">Main App</div>) => {
  const mockNavigateToEvent = vi.fn();
  return render(
    <AuthProvider>
      <NotificationProvider onNavigateToEvent={mockNavigateToEvent}>
        <Router>{children}</Router>
      </NotificationProvider>
    </AuthProvider>
  );
};

describe('Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset location to root
    window.location.pathname = '/';
    mockUseAuth.user = null;
  });

  describe('Landing Page Routing', () => {
    it('should show landing page for non-authenticated users on root path', () => {
      mockUseAuth.user = null;
      window.location.pathname = '/';
      
      renderRouter();
      
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      expect(screen.queryByTestId('main-app')).not.toBeInTheDocument();
    });

    it('should show landing page for non-authenticated users on empty path', () => {
      mockUseAuth.user = null;
      window.location.pathname = '';
      
      renderRouter();
      
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      expect(screen.queryByTestId('main-app')).not.toBeInTheDocument();
    });

    it('should show main app for authenticated users on root path', () => {
      mockUseAuth.user = createMockUser();
      window.location.pathname = '/';
      
      renderRouter();
      
      expect(screen.getByTestId('main-app')).toBeInTheDocument();
      expect(screen.queryByTestId('landing-page')).not.toBeInTheDocument();
    });

    it('should show main app for authenticated users on any path', () => {
      mockUseAuth.user = createMockUser();
      window.location.pathname = '/dashboard';
      
      renderRouter();
      
      expect(screen.getByTestId('main-app')).toBeInTheDocument();
      expect(screen.queryByTestId('landing-page')).not.toBeInTheDocument();
    });
  });

  describe('Shared Content Routing', () => {
    it('should show shared content viewer for shared page routes', () => {
      window.location.pathname = '/shared/page/abc123';
      
      renderRouter();
      
      expect(screen.getByTestId('shared-content-viewer')).toBeInTheDocument();
      expect(screen.getByText('Shared Content: page - abc123')).toBeInTheDocument();
      expect(screen.queryByTestId('main-app')).not.toBeInTheDocument();
      expect(screen.queryByTestId('landing-page')).not.toBeInTheDocument();
    });

    it('should show shared content viewer for shared event routes', () => {
      window.location.pathname = '/shared/event/xyz789';
      
      renderRouter();
      
      expect(screen.getByTestId('shared-content-viewer')).toBeInTheDocument();
      expect(screen.getByText('Shared Content: event - xyz789')).toBeInTheDocument();
      expect(screen.queryByTestId('main-app')).not.toBeInTheDocument();
      expect(screen.queryByTestId('landing-page')).not.toBeInTheDocument();
    });

    it('should not show shared content viewer for invalid shared routes', () => {
      mockUseAuth.user = null;
      window.location.pathname = '/shared/invalid/abc123';
      
      renderRouter();
      
      // Should fall back to landing page for non-authenticated users
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      expect(screen.queryByTestId('shared-content-viewer')).not.toBeInTheDocument();
    });

    it('should not show shared content viewer for incomplete shared routes', () => {
      mockUseAuth.user = null;
      window.location.pathname = '/shared/page';
      
      renderRouter();
      
      // Should fall back to landing page for non-authenticated users
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      expect(screen.queryByTestId('shared-content-viewer')).not.toBeInTheDocument();
    });
  });

  describe('Route Priority', () => {
    it('should prioritize shared routes over landing page', () => {
      mockUseAuth.user = null;
      window.location.pathname = '/shared/page/test123';
      
      renderRouter();
      
      expect(screen.getByTestId('shared-content-viewer')).toBeInTheDocument();
      expect(screen.queryByTestId('landing-page')).not.toBeInTheDocument();
    });

    it('should prioritize shared routes over main app for authenticated users', () => {
      mockUseAuth.user = createMockUser();
      window.location.pathname = '/shared/event/test456';
      
      renderRouter();
      
      expect(screen.getByTestId('shared-content-viewer')).toBeInTheDocument();
      expect(screen.queryByTestId('main-app')).not.toBeInTheDocument();
    });
  });

  describe('Authentication State Changes', () => {
    it('should update routing when user logs in', () => {
      // Start with no user
      mockUseAuth.user = null;
      window.location.pathname = '/';
      
      const { rerender } = renderRouter();
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      
      // Simulate user login
      mockUseAuth.user = createMockUser();
      
      rerender(
        <AuthProvider>
          <NotificationProvider onNavigateToEvent={vi.fn()}>
            <Router><div data-testid="main-app">Main App</div></Router>
          </NotificationProvider>
        </AuthProvider>
      );
      
      expect(screen.getByTestId('main-app')).toBeInTheDocument();
      expect(screen.queryByTestId('landing-page')).not.toBeInTheDocument();
    });

    it('should update routing when user logs out', () => {
      // Start with authenticated user
      mockUseAuth.user = createMockUser();
      window.location.pathname = '/';
      
      const { rerender } = renderRouter();
      expect(screen.getByTestId('main-app')).toBeInTheDocument();
      
      // Simulate user logout
      mockUseAuth.user = null;
      
      rerender(
        <AuthProvider>
          <NotificationProvider onNavigateToEvent={vi.fn()}>
            <Router><div data-testid="main-app">Main App</div></Router>
          </NotificationProvider>
        </AuthProvider>
      );
      
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      expect(screen.queryByTestId('main-app')).not.toBeInTheDocument();
    });
  });
});
