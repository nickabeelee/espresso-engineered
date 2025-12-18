import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { GrinderRepository } from '../repositories/index.js';
import { authenticateRequest, AuthenticatedRequest } from '../middleware/auth.js';
import { validateSchema, createGrinderSchema } from '../validation/schemas.js';
import { CreateGrinderRequest } from '../types/index.js';
import { handleRouteError, isConflictError } from '../utils/error-helpers.js';

const grinderRepository = new GrinderRepository();

export async function grinderRoutes(fastify: FastifyInstance) {
  // GET /api/grinders - List all grinders (public access)
  fastify.get('/api/grinders', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { manufacturer, search } = request.query as { 
        manufacturer?: string;
        search?: string;
      };
      
      let grinders;
      if (search) {
        grinders = await grinderRepository.search(search);
      } else if (manufacturer) {
        grinders = await grinderRepository.findByManufacturer(manufacturer);
      } else {
        grinders = await grinderRepository.findMany();
      }

      return {
        data: grinders,
        count: grinders.length
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch grinders'
      });
    }
  });

  // GET /api/grinders/:id - Get specific grinder (public access)
  fastify.get('/api/grinders/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      
      const grinder = await grinderRepository.findById(id);
      
      return { data: grinder };
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'fetch grinder');
    }
  });

  // POST /api/grinders - Create new grinder (authenticated)
  fastify.post('/api/grinders', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      const grinderData = validateSchema(createGrinderSchema, request.body) as CreateGrinderRequest;

      // Check if grinder name already exists
      const exists = await grinderRepository.existsByName(grinderData.name);
      if (exists) {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'A grinder with this name already exists'
        });
      }

      const grinder = await grinderRepository.create(grinderData);
      
      return reply.status(201).send({ data: grinder });
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'create grinder');
    }
  });

  // PUT /api/grinders/:id - Update grinder (authenticated)
  fastify.put('/api/grinders/:id', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const grinderData = validateSchema(createGrinderSchema.partial(), request.body);

      // Check if new name conflicts with existing grinder
      if (grinderData.name) {
        const exists = await grinderRepository.existsByName(grinderData.name, id);
        if (exists) {
          return reply.status(409).send({
            error: 'Conflict',
            message: 'A grinder with this name already exists'
          });
        }
      }

      const grinder = await grinderRepository.update(id, grinderData);
      
      return { data: grinder };
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'update grinder');
    }
  });

  // DELETE /api/grinders/:id - Delete grinder (authenticated)
  fastify.delete('/api/grinders/:id', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      
      await grinderRepository.delete(id);
      
      return reply.status(204).send();
    } catch (error) {
      if (isConflictError(error)) {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'Cannot delete grinder: it is referenced by existing brews'
        });
      }
      
      request.log.error(error);
      return handleRouteError(error, reply, 'delete grinder');
    }
  });
}