import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { FastifyRequest, FastifyReply } from 'fastify';
import { authenticateRequest, optionalAuthentication, AuthenticatedRequest } from './auth';

// Mock Supabase
jest.mock('../config/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }
}));

describe('Authentication Middleware', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      log: {
        error: jest.fn(),
        warn: jest.fn()
      } as any
    };

    mockReply = {
      status: jest.fn().mockReturnThis() as any,
      send: jest.fn().mockReturnThis() as any
    };

    jest.clearAllMocks();
  });

  describe('authenticateRequest', () => {
    it('should reject requests without authorization header', async () => {
      await authenticateRequest(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      });
    });

    it('should reject requests with invalid authorization format', async () => {
      mockRequest.headers = { authorization: 'InvalidFormat token' };

      await authenticateRequest(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.status).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      });
    });

    it('should handle valid token with existing barista', async () => {
      const { supabase } = await import('../config/supabase');
      
      mockRequest.headers = { authorization: 'Bearer valid-token' };

      // Mock successful auth
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      // Mock successful barista lookup
      const mockSingle = jest.fn() as jest.MockedFunction<any>;
      mockSingle.mockResolvedValue({
        data: {
          id: 'user-123',
          first_name: 'Test',
          last_name: 'User',
          display_name: 'testuser'
        },
        error: null
      });

      const mockEq = jest.fn();
      mockEq.mockReturnValue({
        single: mockSingle
      });

      const mockSelect = jest.fn();
      mockSelect.mockReturnValue({
        eq: mockEq
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      });

      await authenticateRequest(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Should not call reply methods on success
      expect(mockReply.status).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();

      // Should set barista on request
      const authRequest = mockRequest as AuthenticatedRequest;
      expect(authRequest.authUserId).toBe('user-123');
      expect(authRequest.barista).toEqual({
        id: 'user-123',
        first_name: 'Test',
        last_name: 'User',
        display_name: 'testuser'
      });
    });
  });

  describe('optionalAuthentication', () => {
    it('should continue without error when no token provided', async () => {
      await optionalAuthentication(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.status).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });

    it('should continue without error when invalid token provided', async () => {
      const { supabase } = await import('../config/supabase');
      
      mockRequest.headers = { authorization: 'Bearer invalid-token' };

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      });

      await optionalAuthentication(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.status).not.toHaveBeenCalled();
      expect(mockReply.send).not.toHaveBeenCalled();
    });
  });
});