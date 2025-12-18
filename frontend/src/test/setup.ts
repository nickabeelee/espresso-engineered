// Vitest test setup file
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock SvelteKit modules
vi.mock('$app/environment', () => ({
  browser: false,
  dev: true
}));

vi.mock('$app/stores', () => ({
  page: {
    subscribe: vi.fn()
  },
  navigating: {
    subscribe: vi.fn()
  }
}));

// Mock Supabase for tests
vi.mock('$lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  },
  getCurrentBarista: vi.fn(),
  getAuthToken: vi.fn()
}));

// Global test utilities
global.fetch = vi.fn();