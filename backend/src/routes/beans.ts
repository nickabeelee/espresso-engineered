import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BeanRepository, RoasterRepository, BeanRatingRepository } from '../repositories/index.js';
import { authenticateRequest, AuthenticatedRequest } from '../middleware/auth.js';
import { validateSchema, createBeanSchema, createBeanRatingSchema, updateBeanRatingSchema } from '../validation/schemas.js';
import { CreateBeanRequest, CreateBeanRatingRequest, UpdateBeanRatingRequest } from '../types/index.js';
import { handleRouteError, isNotFoundError, isValidationError, isConflictError } from '../utils/error-helpers.js';

const beanRepository = new BeanRepository();
const roasterRepository = new RoasterRepository();
const beanRatingRepository = new BeanRatingRepository();

export async function beanRoutes(fastify: FastifyInstance) {
  // GET /api/beans - List all beans (authenticated access)
  fastify.get('/api/beans', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      const { 
        roaster_id, 
        roast_level, 
        search, 
        my_beans 
      } = request.query as { 
        roaster_id?: string;
        roast_level?: string;
        search?: string;
        my_beans?: string; // "true" to filter to only owned/previously owned beans
      };
      
      let beans: any[];

      if (search) {
        // Use enhanced search that includes tasting notes
        beans = await beanRepository.searchByNameAndNotes(search, authRequest.barista!.id);
      } else if (roaster_id) {
        // Legacy roaster filtering - convert to context-aware results
        const basicBeans = await beanRepository.findByRoaster(roaster_id, { roast_level });
        // Add context to each bean
        beans = await Promise.all(
          basicBeans.map(async (bean) => {
            return await beanRepository.findByIdWithContext(bean.id, authRequest.barista!.id);
          })
        );
      } else {
        // Get all beans with context
        const filters = roast_level ? { roast_level } : {};
        beans = await beanRepository.findManyWithContext(authRequest.barista!.id, filters);
      }

      // Apply "My Beans" filter if requested
      if (my_beans === 'true') {
        beans = beans.filter((bean: any) => 
          bean.ownership_status === 'owned' || bean.ownership_status === 'previously_owned'
        );
      }

      // Apply roaster filter to context-aware results if needed
      if (roaster_id && (search || !roaster_id)) {
        beans = beans.filter((bean: any) => 
          bean.roaster_id === roaster_id || bean.roaster?.id === roaster_id
        );
      }

      // Apply roast level filter to context-aware results if needed
      if (roast_level && (search || my_beans)) {
        beans = beans.filter((bean: any) => bean.roast_level === roast_level);
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
      const authRequest = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      
      const bean = await beanRepository.findByIdWithContext(id, authRequest.barista!.id);
      
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

  // POST /api/beans/:id/rating - Rate a bean (authenticated)
  fastify.post('/api/beans/:id/rating', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      const ratingData = validateSchema(createBeanRatingSchema, request.body) as CreateBeanRatingRequest;

      // Validate that bean exists
      try {
        await beanRepository.findById(id);
      } catch (error) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Bean not found'
        });
      }

      // Create or update rating
      const rating = await beanRatingRepository.upsert(id, authRequest.barista!.id, ratingData.rating);
      
      return reply.status(201).send({ data: rating });
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'create bean rating');
    }
  });

  // PUT /api/beans/:id/rating - Update bean rating (authenticated)
  fastify.put('/api/beans/:id/rating', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      const ratingData = validateSchema(updateBeanRatingSchema, request.body) as UpdateBeanRatingRequest;

      // Validate that bean exists
      try {
        await beanRepository.findById(id);
      } catch (error) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Bean not found'
        });
      }

      // Check if rating exists
      const existingRating = await beanRatingRepository.findByBeanAndBarista(id, authRequest.barista!.id);
      if (!existingRating) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Rating not found'
        });
      }

      // Update rating
      const rating = await beanRatingRepository.upsert(id, authRequest.barista!.id, ratingData.rating);
      
      return { data: rating };
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'update bean rating');
    }
  });

  // DELETE /api/beans/:id/rating - Remove bean rating (authenticated)
  fastify.delete('/api/beans/:id/rating', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };

      // Validate that bean exists
      try {
        await beanRepository.findById(id);
      } catch (error) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Bean not found'
        });
      }

      // Check if rating exists
      const existingRating = await beanRatingRepository.findByBeanAndBarista(id, authRequest.barista!.id);
      if (!existingRating) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Rating not found'
        });
      }

      // Delete rating
      await beanRatingRepository.deleteByBeanAndBarista(id, authRequest.barista!.id);
      
      return reply.status(204).send();
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'delete bean rating');
    }
  });
}