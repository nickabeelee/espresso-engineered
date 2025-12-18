import { describe, it, expect } from 'vitest';
import { getCurrentBarista, getAuthToken } from './supabase';

describe('Supabase Client', () => {
  describe('getCurrentBarista', () => {
    it('should be a function', () => {
      expect(typeof getCurrentBarista).toBe('function');
    });
  });

  describe('getAuthToken', () => {
    it('should be a function', () => {
      expect(typeof getAuthToken).toBe('function');
    });
  });
});