import { FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../config/supabase.js';

// Extended request interface with authenticated user info
export interface AuthenticatedRequest extends FastifyRequest {
  barista?: {
    id: string;
    created_at: string;
    first_name: string;
    last_name: string;
    display_name: string;
    is_admin?: boolean;
  };
  authUserId?: string; // auth.users.id from JWT
}

/**
 * Authentication middleware that validates JWT tokens and resolves barista
 * Extracts auth.users.id from JWT and resolves to barista record
 */
export async function authenticateRequest(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }

    // Store auth.users.id
    (request as AuthenticatedRequest).authUserId = user.id;

    // Resolve auth.users.id to barista record
    const { data: barista, error: baristaError } = await supabase
      .from('barista')
      .select('*')
      .eq('id', user.id)
      .single();

    if (baristaError || !barista) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Barista profile not found for authenticated user'
      });
    }

    // Attach barista to request
    (request as AuthenticatedRequest).barista = barista;

  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
}

/**
 * Optional authentication middleware - doesn't fail if no token provided
 * Useful for endpoints that work differently for authenticated vs anonymous users
 */
export async function optionalAuthentication(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      return;
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      // Invalid token, continue without authentication
      return;
    }

    (request as AuthenticatedRequest).authUserId = user.id;

    const { data: barista } = await supabase
      .from('barista')
      .select('*')
      .eq('id', user.id)
      .single();

    if (barista) {
      (request as AuthenticatedRequest).barista = barista;
    }
  } catch (error) {
    // Log error but don't fail the request
    request.log.warn('Optional authentication failed');
  }
}
