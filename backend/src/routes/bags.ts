import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BagRepository, BeanRepository } from '../repositories/index.js';
import { authenticateRequest, AuthenticatedRequest } from '../middleware/auth.js';
import { validateSchema, createBagSchema } from '../validation/schemas.js';
import { CreateBagRequest } from '../types/index.js';
import { handleRouteError, isNotFoundError, isConflictError } from '../utils/error-helpers.js';

const bagRepository = new BagRepository();
const beanRepository = new BeanRepository();

export async function bagRoutes(fastify: FastifyInstance) {
  // GET /api/bags - List user's bags (authenticated)
  fastify.get('/api/bags', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      const { bean_id, active_only, inventory_status } = request.query as { 
        bean_id?: string;
        active_only?: string;
        inventory_status?: string;
      };
      
      let bags;
      if (bean_id) {
        const filters: Record<string, any> = {};
        if (inventory_status) {
          filters.inventory_status = inventory_status;
        }
        // Use findAllByBean to show all bags for a bean (not just user's bags)
        // This allows viewing related bags on bean detail pages
        bags = await bagRepository.findAllByBean(bean_id);
        // Apply inventory_status filter if provided
        if (inventory_status) {
          bags = bags.filter(bag => bag.inventory_status === inventory_status);
        }
      } else if (active_only === 'true') {
        bags = await bagRepository.findActiveBags(authRequest.barista!.id);
      } else {
        const filters: Record<string, any> = {};
        if (inventory_status) {
          filters.inventory_status = inventory_status;
        }
        bags = await bagRepository.findManyWithDetails(authRequest.barista!.id, filters);
      }

      return {
        data: bags,
        count: bags.length
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch bags'
      });
    }
  });

  // GET /api/bags/:id - Get specific bag (authenticated)
  fastify.get('/api/bags/:id', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      
      const bag = await bagRepository.findByIdWithDetails(id, authRequest.barista!.id, false);
      
      return { data: bag };
    } catch (error) {
      if (isNotFoundError(error)) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Bag not found or access denied'
        });
      }
      
      request.log.error(error);
      return handleRouteError(error, reply, 'fetch bag');
    }
  });

  // POST /api/bags - Create new bag (authenticated)
  fastify.post('/api/bags', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      const bagData = validateSchema(createBagSchema, request.body) as CreateBagRequest;

      // Validate that bean exists
      try {
        await beanRepository.findById(bagData.bean_id);
      } catch (error) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Referenced bean does not exist'
        });
      }

      const bag = await bagRepository.create(bagData, authRequest.barista!.id);
      
      // Fetch the created bag with details
      const bagWithDetails = await bagRepository.findByIdWithDetails(bag.id, authRequest.barista!.id);
      
      return reply.status(201).send({ data: bagWithDetails });
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'create bag');
    }
  });

  // PUT /api/bags/:id - Update bag (authenticated, ownership validated)
  fastify.put('/api/bags/:id', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      const bagData = validateSchema(createBagSchema.partial(), request.body);

      // If bean_id is being updated, validate it exists
      if (bagData.bean_id) {
        try {
          await beanRepository.findById(bagData.bean_id);
        } catch (error) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Referenced bean does not exist'
          });
        }
      }

      // Update bag (ownership validation handled by repository)
      const bag = await bagRepository.update(id, bagData, authRequest.barista!.id);
      
      // Fetch updated bag with details
      const bagWithDetails = await bagRepository.findByIdWithDetails(bag.id, authRequest.barista!.id);
      
      return { data: bagWithDetails };
    } catch (error) {
      if (isNotFoundError(error)) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Bag not found or access denied'
        });
      }
      
      request.log.error(error);
      return handleRouteError(error, reply, 'update bag');
    }
  });

  // DELETE /api/bags/:id - Delete bag (authenticated, ownership validated)
  fastify.delete('/api/bags/:id', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      
      await bagRepository.delete(id, authRequest.barista!.id);
      
      return reply.status(204).send();
    } catch (error) {
      if (isConflictError(error)) {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'Cannot delete bag: it is referenced by existing brews'
        });
      }
      
      if (isNotFoundError(error)) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Bag not found or access denied'
        });
      }
      
      request.log.error(error);
      return handleRouteError(error, reply, 'delete bag');
    }
  });
}
