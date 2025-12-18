import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { RoasterRepository } from '../repositories/index.js';
import { authenticateRequest, AuthenticatedRequest } from '../middleware/auth.js';
import { validateSchema, createRoasterSchema } from '../validation/schemas.js';
import { CreateRoasterRequest } from '../types/index.js';
import { handleRouteError, isConflictError } from '../utils/error-helpers.js';

const roasterRepository = new RoasterRepository();

export async function roasterRoutes(fastify: FastifyInstance) {
  // GET /api/roasters - List all roasters (public access)
  fastify.get('/api/roasters', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { search } = request.query as { search?: string };
      
      let roasters;
      if (search) {
        roasters = await roasterRepository.findByName(search);
      } else {
        roasters = await roasterRepository.findMany();
      }

      return {
        data: roasters,
        count: roasters.length
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch roasters'
      });
    }
  });

  // GET /api/roasters/:id - Get specific roaster (public access)
  fastify.get('/api/roasters/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      
      const roaster = await roasterRepository.findById(id);
      
      return { data: roaster };
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'fetch roaster');
    }
  });

  // POST /api/roasters - Create new roaster (authenticated)
  fastify.post('/api/roasters', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      const roasterData = validateSchema(createRoasterSchema, request.body) as CreateRoasterRequest;

      // Check if roaster name already exists
      const exists = await roasterRepository.existsByName(roasterData.name);
      if (exists) {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'A roaster with this name already exists'
        });
      }

      const roaster = await roasterRepository.create(roasterData);
      
      return reply.status(201).send({ data: roaster });
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'create roaster');
    }
  });

  // PUT /api/roasters/:id - Update roaster (authenticated)
  fastify.put('/api/roasters/:id', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const roasterData = validateSchema(createRoasterSchema.partial(), request.body);

      // Check if new name conflicts with existing roaster
      if (roasterData.name) {
        const exists = await roasterRepository.existsByName(roasterData.name, id);
        if (exists) {
          return reply.status(409).send({
            error: 'Conflict',
            message: 'A roaster with this name already exists'
          });
        }
      }

      const roaster = await roasterRepository.update(id, roasterData);
      
      return { data: roaster };
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'update roaster');
    }
  });

  // DELETE /api/roasters/:id - Delete roaster (authenticated)
  fastify.delete('/api/roasters/:id', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      
      await roasterRepository.delete(id);
      
      return reply.status(204).send();
    } catch (error) {
      if (isConflictError(error)) {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'Cannot delete roaster: it is referenced by existing beans'
        });
      }
      
      request.log.error(error);
      return handleRouteError(error, reply, 'delete roaster');
    }
  });
}