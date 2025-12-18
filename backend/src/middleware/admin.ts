import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticatedRequest } from './auth.js';

/**
 * Admin authentication middleware that checks for admin privileges
 * Must be used after authenticateRequest middleware
 */
export async function requireAdminAccess(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authRequest = request as AuthenticatedRequest;
    
    // Ensure user is authenticated first
    if (!authRequest.barista) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // Check if barista has admin privileges using the is_admin field
    const isAdmin = authRequest.barista.is_admin === true;

    if (!isAdmin) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    // Add admin flag to request for downstream handlers
    (authRequest as any).isAdmin = true;

  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Admin authentication failed'
    });
  }
}

/**
 * Extended request interface for admin operations
 */
export interface AdminRequest extends AuthenticatedRequest {
  isAdmin: boolean;
}