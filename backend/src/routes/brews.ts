import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BrewRepository } from '../repositories/index.js';
import { authenticateRequest, AuthenticatedRequest } from '../middleware/auth.js';
import { 
  validateSchema, 
  createBrewSchema, 
  updateBrewSchema, 
  completeDraftSchema,
  batchSyncSchema 
} from '../validation/schemas.js';
import { 
  CreateBrewRequest, 
  BrewFilters,
  Brew 
} from '../types/index.js';
import { handleRouteError, isNotFoundError } from '../utils/error-helpers.js';

const brewRepository = new BrewRepository();

export async function brewRoutes(fastify: FastifyInstance) {
  // GET /api/brews/week - Get brews from current week grouped by barista and bean
  fastify.get('/api/brews/week', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { week_start } = request.query as { week_start?: string };
      
      let weekStartDate: Date | undefined;
      if (week_start) {
        weekStartDate = new Date(week_start);
        if (isNaN(weekStartDate.getTime())) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Invalid week_start date format'
          });
        }
      }

      const groups = await brewRepository.findWeekBrews(weekStartDate);
      
      // Calculate the actual week start used
      const actualWeekStart = weekStartDate || (() => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - daysToMonday);
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
      })();

      return {
        data: groups,
        count: groups.length,
        week_start: actualWeekStart.toISOString()
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch week brews'
      });
    }
  });

  // POST /api/brews - Create new brew
  fastify.post('/api/brews', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      const validatedBrewData = validateSchema(createBrewSchema, request.body) as CreateBrewRequest;
      
      const brew = await brewRepository.create(validatedBrewData, authRequest.barista!.id);
      
      return reply.status(201).send({ data: brew });
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'create brew');
    }
  });

  // GET /api/brews/analysis - Get brew analysis data for scatter plots
  fastify.get('/api/brews/analysis', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      const { bean_id, bag_id, recency, include_community } = request.query as { 
        bean_id?: string;
        bag_id?: string;
        recency?: '2D' | 'W' | 'M' | '3M' | 'Y';
        include_community?: string;
      };

      // Validate recency parameter
      if (recency && !['2D', 'W', 'M', '3M', 'Y'].includes(recency)) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid recency parameter. Must be one of: 2D, W, M, 3M, Y'
        });
      }

      const analysisData = await brewRepository.findAnalysisData({
        bean_id,
        bag_id,
        recency,
        barista_id: authRequest.barista!.id,
        include_community: include_community === 'true'
      });

      return {
        data: analysisData.brews,
        count: analysisData.brews.length,
        bean: analysisData.bean,
        bag: analysisData.bag,
        filters: {
          bean_id,
          bag_id,
          recency
        }
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch brew analysis data'
      });
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
      const { brews } = request.body as { brews: any[] };
      
      const validatedData = validateSchema(batchSyncSchema, { brews });

      const results: { success: Brew[], errors: Array<{ index: number, error: string }> } = {
        success: [],
        errors: []
      };

      // Process each brew in the batch
      for (let i = 0; i < validatedData.brews.length; i++) {
        try {
          const brew = await brewRepository.create(validatedData.brews[i], authRequest.barista!.id);
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
