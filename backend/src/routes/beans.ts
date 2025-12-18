import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BeanRepository, RoasterRepository } from '../repositories/index.js';
import { authenticateRequest, AuthenticatedRequest } from '../middleware/auth.js';
import { validateSchema, createBeanSchema } from '../validation/schemas.js';
import { CreateBeanRequest } from '../types/index.js';
import { handleRouteError, isNotFoundError, isValidationError, isConflictError } from '../utils/error-helpers.js';

const beanRepository = new BeanRepository();
const roasterRepository = new RoasterRepository();

export async function beanRoutes(fastify: FastifyInstance) {
  // GET /api/beans - List all beans (authenticated access)
  fastify.get('/api/beans', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { roaster_id, roast_level, search } = request.query as { 
        roaster_id?: string;
        roast_level?: string;
        search?: string;
      };
      
      let beans;
      if (search) {
        beans = await beanRepository.searchByName(search);
      } else if (roaster_id) {
        beans = await beanRepository.findByRoaster(roaster_id, { roast_level });
      } else {
        const filters = roast_level ? { roast_level } : {};
        beans = await beanRepository.findManyWithRoaster(filters);
      }

      return {
        data: beans,
        count: beans.length
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch beans'
      });
    }
  });

  // GET /api/beans/:id - Get specific bean (authenticated access)
  fastify.get('/api/beans/:id', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      
      const bean = await beanRepository.findById(id);
      
      return { data: bean };
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'fetch bean');
    }
  });

  // POST /api/beans - Create new bean (authenticated)
  fastify.post('/api/beans', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      const beanData = validateSchema(createBeanSchema, request.body) as CreateBeanRequest;

      // Validate that roaster exists
      try {
        await roasterRepository.findById(beanData.roaster_id);
      } catch (error) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Referenced roaster does not exist'
        });
      }

      // Check if bean name already exists for this roaster
      const exists = await beanRepository.existsByNameAndRoaster(
        beanData.name, 
        beanData.roaster_id
      );
      if (exists) {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'A bean with this name already exists for this roaster'
        });
      }

      const bean = await beanRepository.create(beanData);
      
      return reply.status(201).send({ data: bean });
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'create bean');
    }
  });

  // PUT /api/beans/:id - Update bean (authenticated)
  fastify.put('/api/beans/:id', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const beanData = validateSchema(createBeanSchema.partial(), request.body);

      // If roaster_id is being updated, validate it exists
      if (beanData.roaster_id) {
        try {
          await roasterRepository.findById(beanData.roaster_id);
        } catch (error) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Referenced roaster does not exist'
          });
        }
      }

      // Check if new name conflicts with existing bean for the roaster
      if (beanData.name && beanData.roaster_id) {
        const exists = await beanRepository.existsByNameAndRoaster(
          beanData.name, 
          beanData.roaster_id, 
          id
        );
        if (exists) {
          return reply.status(409).send({
            error: 'Conflict',
            message: 'A bean with this name already exists for this roaster'
          });
        }
      }

      const bean = await beanRepository.update(id, beanData);
      
      return { data: bean };
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'update bean');
    }
  });

  // DELETE /api/beans/:id - Delete bean (authenticated)
  fastify.delete('/api/beans/:id', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      
      await beanRepository.delete(id);
      
      return reply.status(204).send();
    } catch (error) {
      if (isConflictError(error)) {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'Cannot delete bean: it is referenced by existing bags'
        });
      }
      
      request.log.error(error);
      return handleRouteError(error, reply, 'delete bean');
    }
  });
}