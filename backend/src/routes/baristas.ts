import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { supabase } from '../config/supabase.js';
import { authenticateRequest } from '../middleware/auth.js';
import { handleRouteError } from '../utils/error-helpers.js';

export async function baristaRoutes(fastify: FastifyInstance) {
  fastify.get('/api/baristas', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { data, error } = await supabase
        .from('barista')
        .select('id, created_at, display_name, first_name, last_name, is_admin')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        data: data ?? [],
        count: data?.length ?? 0
      };
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'fetch baristas');
    }
  });
}
