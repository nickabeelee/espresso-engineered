import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { authService, user, session, barista, isAuthenticated } from './auth';

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      }))
    }))
  }
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset stores
    user.set(null);
    session.set(null);
    barista.set(null);
  });

  describe('stores', () => {
    it('should initialize with null values', () => {
      expect(get(user)).toBeNull();
      expect(get(session)).toBeNull();
      expect(get(barista)).toBeNull();
      expect(get(isAuthenticated)).toBe(false);
    });

    it('should update isAuthenticated when user and barista are set', () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' } as any;
      const mockBarista = { id: 'user-1', first_name: 'Test', last_name: 'User' } as any;

      user.set(mockUser);
      barista.set(mockBarista);

      expect(get(isAuthenticated)).toBe(true);
    });

    it('should not be authenticated with only user', () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' } as any;
      user.set(mockUser);

      expect(get(isAuthenticated)).toBe(false);
    });

    it('should not be authenticated with only barista', () => {
      const mockBarista = { id: 'user-1', first_name: 'Test', last_name: 'User' } as any;
      barista.set(mockBarista);

      expect(get(isAuthenticated)).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' } as any;
      user.set(mockUser);

      expect(authService.getCurrentUser()).toEqual(mockUser);
    });

    it('should return null when no user', () => {
      expect(authService.getCurrentUser()).toBeNull();
    });
  });

  describe('getCurrentBarista', () => {
    it('should return current barista', () => {
      const mockBarista = { id: 'user-1', first_name: 'Test', last_name: 'User' } as any;
      barista.set(mockBarista);

      expect(authService.getCurrentBarista()).toEqual(mockBarista);
    });

    it('should return null when no barista', () => {
      expect(authService.getCurrentBarista()).toBeNull();
    });
  });

  describe('getCurrentSession', () => {
    it('should return current session', () => {
      const mockSession = { access_token: 'token-123', user: { id: 'user-1' } } as any;
      session.set(mockSession);

      expect(authService.getCurrentSession()).toEqual(mockSession);
    });

    it('should return null when no session', () => {
      expect(authService.getCurrentSession()).toBeNull();
    });
  });

  describe('getAuthToken', () => {
    it('should return access token from session', async () => {
      const mockSession = { access_token: 'token-123', user: { id: 'user-1' } } as any;
      session.set(mockSession);

      const token = await authService.getAuthToken();
      expect(token).toBe('token-123');
    });

    it('should return null when no session', async () => {
      const token = await authService.getAuthToken();
      expect(token).toBeNull();
    });
  });
});