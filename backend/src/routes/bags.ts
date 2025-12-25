import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BagRepository, BeanRepository } from '../repositories/index.js';
import { authenticateRequest, AuthenticatedRequest } from '../middleware/auth.js';
import { validateSchema, createBagSchema } from '../validation/schemas.js';
import { CreateBagRequest } from '../types/index.js';
import { handleRouteError, isNotFoundError, isConflictError } from '../utils/error-helpers.js';
import { namingService, NamingError } from '../services/naming.js';

const bagRepository = new BagRepository();
const beanRepository = new BeanRepository();

export async function bagRoutes(fastify: FastifyInstance) {
  // GET /api/bags - List user's bags (authenticated)
  fastify.get('/api/bags', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      const { bean_id, active_only } = request.query as { 
        bean_id?: string;
        active_only?: string;
      };
      
      let bags;
      if (bean_id) {
        bags = await bagRepository.findByBean(bean_id, authRequest.barista!.id);
      } else if (active_only === 'true') {
        bags = await bagRepository.findActiveBags(authRequest.barista!.id);
      } else {
        bags = await bagRepository.findManyWithDetails(authRequest.barista!.id);
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

  // POST /api/bags/preview-name - Preview bag name (authenticated)
  fastify.post('/api/bags/preview-name', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      const { bean_id, roast_date } = request.body as { bean_id: string; roast_date?: string };

      if (!bean_id) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'bean_id is required for name preview'
        });
      }

      // Validate that bean exists
      try {
        await beanRepository.findById(bean_id);
      } catch (error) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Referenced bean does not exist'
        });
      }

      // Generate preview name
      try {
        const previewName = await namingService.generateBagName(
          authRequest.barista!.id,
          bean_id,
          roast_date
        );
        
        return { data: { name: previewName } };
      } catch (error) {
        request.log.warn({ error }, 'Failed to generate bag name preview');
        
        if (error instanceof NamingError) {
          request.log.warn({
            entityType: error.entityType,
            entityId: error.entityId,
            cause: error.cause?.message
          }, `Naming error for bag preview: ${error.message}`);
        }
        
        return reply.status(500).send({
          error: 'Naming Error',
          message: 'Failed to generate name preview'
        });
      }
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'preview bag name');
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

      // Generate automatic name before database insertion
      let generatedName: string | undefined = undefined;
      try {
        generatedName = await namingService.generateBagName(
          authRequest.barista!.id,
          bagData.bean_id,
          bagData.roast_date
        );
      } catch (error) {
        // Log naming failure but continue with creation
        request.log.warn({ error }, 'Failed to generate bag name');
        
        if (error instanceof NamingError) {
          request.log.warn({
            entityType: error.entityType,
            entityId: error.entityId,
            cause: error.cause?.message
          }, `Naming error for bag creation: ${error.message}`);
        }
        
        // Set name to undefined if naming fails completely
        generatedName = undefined;
      }

      // Create bag with generated name and ownership set to current barista
      const bagDataWithName = {
        ...bagData,
        name: generatedName
      };
      
      const bag = await bagRepository.create(bagDataWithName, authRequest.barista!.id);
      
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
