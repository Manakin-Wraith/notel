import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

const mockSupabase = supabase as any;

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    PROD: false,
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');
      
      consoleSpy.mockRestore();
    });

    it('should provide auth context when used within AuthProvider', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      expect(result.current).toEqual({
        user: null,
        session: null,
        loading: true,
        signIn: expect.any(Function),
        signUp: expect.any(Function),
        signInWithGoogle: expect.any(Function),
        signOut: expect.any(Function),
      });
    });
  });

  describe('AuthProvider', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBe(null);
      expect(result.current.session).toBe(null);
    });

    it('should set user and session when session exists', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'token-123',
      };
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      // Wait for the effect to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(result.current.loading).toBe(false);
      expect(result.current.user).toEqual(mockSession.user);
      expect(result.current.session).toEqual(mockSession);
    });

    it('should handle auth state changes', async () => {
      let authStateCallback: any;
      
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      const newSession = {
        user: { id: 'user-456', email: 'new@example.com' },
        access_token: 'token-456',
      };
      
      // Simulate auth state change
      act(() => {
        authStateCallback('SIGNED_IN', newSession);
      });
      
      expect(result.current.user).toEqual(newSession.user);
      expect(result.current.session).toEqual(newSession);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('signInWithGoogle', () => {
    it('should call supabase signInWithOAuth with correct parameters in development', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({ error: null });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await act(async () => {
        const response = await result.current.signInWithGoogle();
        expect(response).toEqual({ error: null });
      });
      
      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:5173/',
        },
      });
    });

    it('should use production URL in production environment', async () => {
      // Mock production environment
      vi.mocked(import.meta.env).PROD = true;
      
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({ error: null });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await act(async () => {
        await result.current.signInWithGoogle();
      });
      
      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'https://notel-wine.vercel.app/',
        },
      });
      
      // Reset to development
      vi.mocked(import.meta.env).PROD = false;
    });

    it('should return error when OAuth fails', async () => {
      const authError = new Error('OAuth failed');
      mockSupabase.auth.signInWithOAuth.mockResolvedValue({ error: authError });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await act(async () => {
        const response = await result.current.signInWithGoogle();
        expect(response).toEqual({ error: authError });
      });
    });

    it('should handle network errors during OAuth', async () => {
      const networkError = new Error('Network error');
      mockSupabase.auth.signInWithOAuth.mockRejectedValue(networkError);
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await act(async () => {
        try {
          await result.current.signInWithGoogle();
        } catch (error) {
          expect(error).toBe(networkError);
        }
      });
    });
  });

  describe('signIn', () => {
    it('should call supabase signInWithPassword with correct parameters', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await act(async () => {
        const response = await result.current.signIn('test@example.com', 'password123');
        expect(response).toEqual({ error: null });
      });
      
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should return error when sign in fails', async () => {
      const authError = new Error('Invalid credentials');
      mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: authError });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await act(async () => {
        const response = await result.current.signIn('test@example.com', 'wrongpassword');
        expect(response).toEqual({ error: authError });
      });
    });
  });

  describe('signUp', () => {
    it('should call supabase signUp with correct parameters in development', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({ error: null });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await act(async () => {
        const response = await result.current.signUp('test@example.com', 'password123');
        expect(response).toEqual({ error: null });
      });
      
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: 'http://localhost:5173/',
        },
      });
    });

    it('should use production URL in production environment', async () => {
      // Mock production environment
      vi.mocked(import.meta.env).PROD = true;
      
      mockSupabase.auth.signUp.mockResolvedValue({ error: null });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await act(async () => {
        await result.current.signUp('test@example.com', 'password123');
      });
      
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: 'https://notel-wine.vercel.app/',
        },
      });
      
      // Reset to development
      vi.mocked(import.meta.env).PROD = false;
    });
  });

  describe('signOut', () => {
    it('should call supabase signOut', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await act(async () => {
        const response = await result.current.signOut();
        expect(response).toEqual({ error: null });
      });
      
      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
    });

    it('should return error when sign out fails', async () => {
      const authError = new Error('Sign out failed');
      mockSupabase.auth.signOut.mockResolvedValue({ error: authError });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await act(async () => {
        const response = await result.current.signOut();
        expect(response).toEqual({ error: authError });
      });
    });
  });
});
