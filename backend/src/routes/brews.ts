import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BrewRepository } from '../repositories/index.js';
import { authenticateRequest, AuthenticatedRequest } from '../middleware/auth.js';
import { 
  validateSchema, 
  createBrewSchema, 
  updateBrewSchema, 
  completeDraftSchema,
  brewFiltersSchema,
  batchSyncSchema 
} from '../validation/schemas.js';
import { 
  CreateBrewRequest, 
  UpdateBrewRequest, 
  BrewFilters,
  Brew 
} from '../types/index.js';
import { handleRouteError, isNotFoundError, isConflictError } from '../utils/error-helpers.js';
import { namingService, NamingError } from '../services/naming.js';

const brewRepository = new BrewRepository();

export async function brewRoutes(fastify: FastifyInstance) {
  // POST /api/brews/preview-name - Preview brew name (authenticated)
  fastify.post('/api/brews/preview-name', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      const { bag_id, _timezone } = request.body as { 
        bag_id: string;
        _timezone?: {
          browserTimezone: string;
          userTimezone?: string;
          confidence: string;
        };
      };

      if (!bag_id) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'bag_id is required for name preview'
        });
      }

      // Generate preview name with timezone information
      try {
        const previewName = await namingService.generateBrewName(
          authRequest.barista!.id,
          bag_id,
          new Date(),
          _timezone ? {
            browserTimezone: _timezone.browserTimezone,
            userTimezone: _timezone.userTimezone
          } : undefined
        );
        
        return { data: { name: previewName } };
      } catch (error) {
        request.log.warn({ error }, 'Failed to generate brew name preview');
        
        if (error instanceof NamingError) {
          request.log.warn({
            entityType: error.entityType,
            entityId: error.entityId,
            cause: error.cause?.message
          }, `Naming error for brew preview: ${error.message}`);
        }
        
        return reply.status(500).send({
          error: 'Naming Error',
          message: 'Failed to generate name preview'
        });
      }
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'preview brew name');
    }
  });

  // POST /api/brews - Create new brew
  fastify.post('/api/brews', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      const { _timezone, ...brewData } = request.body as CreateBrewRequest & {
        _timezone?: {
          browserTimezone: string;
          userTimezone?: string;
          confidence: string;
        };
      };
      
      const validatedBrewData = validateSchema(createBrewSchema, brewData) as CreateBrewRequest;

      // Generate automatic name before database insertion with timezone information
      let generatedName: string | undefined = undefined;
      try {
        generatedName = await namingService.generateBrewName(
          authRequest.barista!.id,
          validatedBrewData.bag_id,
          new Date(),
          _timezone ? {
            browserTimezone: _timezone.browserTimezone,
            userTimezone: _timezone.userTimezone
          } : undefined
        );
      } catch (error) {
        // Log naming failure but continue with creation
        request.log.warn({ error }, 'Failed to generate brew name');
        
        if (error instanceof NamingError) {
          request.log.warn({
            entityType: error.entityType,
            entityId: error.entityId,
            cause: error.cause?.message
          }, `Naming error for brew creation: ${error.message}`);
        }
        
        // Set name to undefined if naming fails completely
        generatedName = undefined;
      }

      // Create brew with generated name and calculated fields
      const brewDataWithName = {
        ...validatedBrewData,
        name: generatedName
      };
      
      const brew = await brewRepository.create(brewDataWithName, authRequest.barista!.id);
      
      return reply.status(201).send({ data: brew });
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'create brew');
    }
  });

  // GET /api/brews - List brews with filtering
  fastify.get('/api/brews', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      const queryParams = request.query as Record<string, any>;
      
      // Parse and validate filters
      const filters: BrewFilters = {};
      if (queryParams.barista_id) filters.barista_id = queryParams.barista_id;
      if (queryParams.machine_id) filters.machine_id = queryParams.machine_id;
      if (queryParams.grinder_id) filters.grinder_id = queryParams.grinder_id;
      if (queryParams.bag_id) filters.bag_id = queryParams.bag_id;
      if (queryParams.rating_min) filters.rating_min = parseInt(queryParams.rating_min);
      if (queryParams.rating_max) filters.rating_max = parseInt(queryParams.rating_max);
      if (queryParams.date_from) filters.date_from = queryParams.date_from;
      if (queryParams.date_to) filters.date_to = queryParams.date_to;
      if (queryParams.has_reflections !== undefined) {
        filters.has_reflections = queryParams.has_reflections === 'true';
      }
      if (queryParams.is_draft !== undefined) {
        filters.is_draft = queryParams.is_draft === 'true';
      }

      const brews = await brewRepository.findWithFilters(filters);

      return {
        data: brews,
        count: brews.length
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch brews'
      });
    }
  });

  // GET /api/brews/prefill - Get prefill data from most recent brew
  fastify.get('/api/brews/prefill', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      
      const prefillData = await brewRepository.getPrefillData(authRequest.barista!.id);
      
      if (!prefillData) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'No previous brews found for prefill'
        });
      }

      return { data: prefillData };
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'get prefill data');
    }
  });

  // GET /api/brews/drafts - Get incomplete brews for reflection
  fastify.get('/api/brews/drafts', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      
      const drafts = await brewRepository.findDrafts(authRequest.barista!.id);

      return {
        data: drafts,
        count: drafts.length
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch draft brews'
      });
    }
  });

  // GET /api/brews/:id - Get specific brew
  fastify.get('/api/brews/:id', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      
      const brew = await brewRepository.findById(id);
      
      return { data: brew };
    } catch (error) {
      if (isNotFoundError(error)) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Brew not found or access denied'
        });
      }
      
      request.log.error(error);
      return handleRouteError(error, reply, 'fetch brew');
    }
  });

  // PUT /api/brews/:id - Update brew
  fastify.put('/api/brews/:id', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      const brewData = validateSchema(updateBrewSchema, request.body);
      const ownerId = authRequest.barista?.is_admin ? undefined : authRequest.barista!.id;

      // Update brew with calculated fields
      const brew = await brewRepository.update(id, brewData, ownerId);
      
      return { data: brew };
    } catch (error) {
      if (isNotFoundError(error)) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Brew not found or access denied'
        });
      }
      
      request.log.error(error);
      return handleRouteError(error, reply, 'update brew');
    }
  });

  // POST /api/brews/:id/complete - Complete a draft brew
  fastify.post('/api/brews/:id/complete', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      const outputData = validateSchema(completeDraftSchema, request.body);
      const ownerId = authRequest.barista?.is_admin ? undefined : authRequest.barista!.id;

      // Complete the draft with output measurements
      const brew = await brewRepository.completeDraft(id, outputData, ownerId);
      
      return { data: brew };
    } catch (error) {
      if (isNotFoundError(error)) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Brew not found or access denied'
        });
      }
      
      if (error instanceof Error && error.message.includes('not a draft')) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: error.message
        });
      }
      
      request.log.error(error);
      return handleRouteError(error, reply, 'complete draft brew');
    }
  });

  // DELETE /api/brews/:id - Delete brew
  fastify.delete('/api/brews/:id', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      const ownerId = authRequest.barista?.is_admin ? undefined : authRequest.barista!.id;
      
      await brewRepository.delete(id, ownerId);
      
      return reply.status(204).send();
    } catch (error) {
      if (isNotFoundError(error)) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Brew not found or access denied'
        });
      }
      
      request.log.error(error);
      return handleRouteError(error, reply, 'delete brew');
    }
  });

  // POST /api/brews/batch-sync - Batch sync multiple brews
  fastify.post('/api/brews/batch-sync', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      const { brews, _timezone } = request.body as {
        brews: any[];
        _timezone?: {
          browserTimezone: string;
          userTimezone?: string;
          confidence: string;
        };
      };
      
      const validatedData = validateSchema(batchSyncSchema, { brews });

      const results: { success: Brew[], errors: Array<{ index: number, error: string }> } = {
        success: [],
        errors: []
      };

      // Process each brew in the batch
      for (let i = 0; i < validatedData.brews.length; i++) {
        try {
          // Generate automatic name for each brew before creation with timezone information
          let generatedName: string | undefined = undefined;
          try {
            generatedName = await namingService.generateBrewName(
              authRequest.barista!.id,
              validatedData.brews[i].bag_id,
              new Date(),
              _timezone ? {
                browserTimezone: _timezone.browserTimezone,
                userTimezone: _timezone.userTimezone
              } : undefined
            );
          } catch (error) {
            // Log naming failure but continue with creation
            request.log.warn({ error }, `Failed to generate name for batch brew ${i}`);
            generatedName = undefined;
          }

          const brewDataWithName = {
            ...validatedData.brews[i],
            name: generatedName
          };

          const brew = await brewRepository.create(brewDataWithName, authRequest.barista!.id);
          results.success.push(brew);
        } catch (error) {
          results.errors.push({
            index: i,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Return partial success if some brews failed
      const statusCode = results.errors.length > 0 ? 207 : 201; // 207 Multi-Status
      
      return reply.status(statusCode).send({
        data: results.success,
        errors: results.errors,
        summary: {
          total: validatedData.brews.length,
          successful: results.success.length,
          failed: results.errors.length
        }
      });
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'batch sync brews');
    }
  });
}
