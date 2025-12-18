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

const brewRepository = new BrewRepository();

export async function brewRoutes(fastify: FastifyInstance) {
  // POST /api/brews - Create new brew
  fastify.post('/api/brews', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      const brewData = validateSchema(createBrewSchema, request.body) as CreateBrewRequest;

      // Create brew with calculated fields
      const brew = await brewRepository.create(brewData, authRequest.barista!.id);
      
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

      // Get brews for the authenticated barista
      const brews = await brewRepository.findWithFilters(filters, authRequest.barista!.id);

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
      const authRequest = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      
      const brew = await brewRepository.findById(id, authRequest.barista!.id);
      
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

      // Update brew with calculated fields
      const brew = await brewRepository.update(id, brewData, authRequest.barista!.id);
      
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

      // Complete the draft with output measurements
      const brew = await brewRepository.completeDraft(id, outputData, authRequest.barista!.id);
      
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
      
      await brewRepository.delete(id, authRequest.barista!.id);
      
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
      const { brews } = validateSchema(batchSyncSchema, request.body);

      const results: { success: Brew[], errors: Array<{ index: number, error: string }> } = {
        success: [],
        errors: []
      };

      // Process each brew in the batch
      for (let i = 0; i < brews.length; i++) {
        try {
          const brew = await brewRepository.create(brews[i], authRequest.barista!.id);
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
          total: brews.length,
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