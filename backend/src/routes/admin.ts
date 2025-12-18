import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticateRequest } from '../middleware/auth.js';
import { requireAdminAccess, AdminRequest } from '../middleware/admin.js';
import { AdminRepository } from '../repositories/admin.js';
import { validateSchema, updateBrewSchema } from '../validation/schemas.js';
import { handleRouteError, isNotFoundError, isValidationError } from '../utils/error-helpers.js';
import type { BrewFilters } from '../types/index.js';

const adminRepository = new AdminRepository();

export async function adminRoutes(fastify: FastifyInstance) {
  
  // Admin dashboard - get overview data
  fastify.get('/api/admin/dashboard', {
    preHandler: [authenticateRequest, requireAdminAccess]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const dashboardData = await adminRepository.getModerationDashboard();
      return { data: dashboardData };
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'fetch admin dashboard');
    }
  });

  // Admin brew management
  fastify.get('/api/admin/brews', {
    preHandler: [authenticateRequest, requireAdminAccess]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const queryParams = request.query as Record<string, any>;
      
      // Parse filters
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

      const brews = await adminRepository.getAllBrews(filters);

      return {
        data: brews,
        count: brews.length
      };
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'fetch admin brews');
    }
  });

  fastify.get('/api/admin/brews/:id', {
    preHandler: [authenticateRequest, requireAdminAccess]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const brew = await adminRepository.getBrewById(id);
      return { data: brew };
    } catch (error) {
      if (isNotFoundError(error)) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Brew not found'
        });
      }
      request.log.error(error);
      return handleRouteError(error, reply, 'fetch admin brew');
    }
  });

  fastify.put('/api/admin/brews/:id', {
    preHandler: [authenticateRequest, requireAdminAccess]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const brewData = validateSchema(updateBrewSchema, request.body);

      const brew = await adminRepository.updateBrew(id, brewData);
      return { data: brew };
    } catch (error) {
      if (isNotFoundError(error)) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Brew not found'
        });
      }
      request.log.error(error);
      return handleRouteError(error, reply, 'update admin brew');
    }
  });

  fastify.delete('/api/admin/brews/:id', {
    preHandler: [authenticateRequest, requireAdminAccess]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      await adminRepository.deleteBrew(id);
      return reply.status(204).send();
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'delete admin brew');
    }
  });

  // Admin barista management
  fastify.get('/api/admin/baristas', {
    preHandler: [authenticateRequest, requireAdminAccess]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const baristas = await adminRepository.getAllBaristas();
      return {
        data: baristas,
        count: baristas.length
      };
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'fetch admin baristas');
    }
  });

  // Admin bean management
  fastify.get('/api/admin/beans', {
    preHandler: [authenticateRequest, requireAdminAccess]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const beans = await adminRepository.getAllBeans();
      return {
        data: beans,
        count: beans.length
      };
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'fetch admin beans');
    }
  });

  fastify.put('/api/admin/beans/:id', {
    preHandler: [authenticateRequest, requireAdminAccess]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const beanData = request.body as any; // TODO: Add proper validation schema

      const bean = await adminRepository.updateBean(id, beanData);
      return { data: bean };
    } catch (error) {
      if (isNotFoundError(error)) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Bean not found'
        });
      }
      request.log.error(error);
      return handleRouteError(error, reply, 'update admin bean');
    }
  });

  fastify.delete('/api/admin/beans/:id', {
    preHandler: [authenticateRequest, requireAdminAccess]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      await adminRepository.deleteBean(id);
      return reply.status(204).send();
    } catch (error) {
      if (isValidationError(error)) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: (error as Error).message
        });
      }
      request.log.error(error);
      return handleRouteError(error, reply, 'delete admin bean');
    }
  });

  // Admin bag management
  fastify.get('/api/admin/bags', {
    preHandler: [authenticateRequest, requireAdminAccess]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const bags = await adminRepository.getAllBags();
      return {
        data: bags,
        count: bags.length
      };
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'fetch admin bags');
    }
  });

  fastify.put('/api/admin/bags/:id', {
    preHandler: [authenticateRequest, requireAdminAccess]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const bagData = request.body as any; // TODO: Add proper validation schema

      const bag = await adminRepository.updateBag(id, bagData);
      return { data: bag };
    } catch (error) {
      if (isNotFoundError(error)) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Bag not found'
        });
      }
      request.log.error(error);
      return handleRouteError(error, reply, 'update admin bag');
    }
  });

  fastify.delete('/api/admin/bags/:id', {
    preHandler: [authenticateRequest, requireAdminAccess]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      await adminRepository.deleteBag(id);
      return reply.status(204).send();
    } catch (error) {
      if (isValidationError(error)) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: (error as Error).message
        });
      }
      request.log.error(error);
      return handleRouteError(error, reply, 'delete admin bag');
    }
  });

  // Admin grinder management
  fastify.get('/api/admin/grinders', {
    preHandler: [authenticateRequest, requireAdminAccess]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const grinders = await adminRepository.getAllGrinders();
      return {
        data: grinders,
        count: grinders.length
      };
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'fetch admin grinders');
    }
  });

  fastify.put('/api/admin/grinders/:id', {
    preHandler: [authenticateRequest, requireAdminAccess]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const grinderData = request.body as any; // TODO: Add proper validation schema

      const grinder = await adminRepository.updateGrinder(id, grinderData);
      return { data: grinder };
    } catch (error) {
      if (isNotFoundError(error)) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Grinder not found'
        });
      }
      request.log.error(error);
      return handleRouteError(error, reply, 'update admin grinder');
    }
  });

  fastify.delete('/api/admin/grinders/:id', {
    preHandler: [authenticateRequest, requireAdminAccess]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      await adminRepository.deleteGrinder(id);
      return reply.status(204).send();
    } catch (error) {
      if (isValidationError(error)) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: (error as Error).message
        });
      }
      request.log.error(error);
      return handleRouteError(error, reply, 'delete admin grinder');
    }
  });

  // Admin machine management
  fastify.get('/api/admin/machines', {
    preHandler: [authenticateRequest, requireAdminAccess]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const machines = await adminRepository.getAllMachines();
      return {
        data: machines,
        count: machines.length
      };
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'fetch admin machines');
    }
  });

  fastify.put('/api/admin/machines/:id', {
    preHandler: [authenticateRequest, requireAdminAccess]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const machineData = request.body as any; // TODO: Add proper validation schema

      const machine = await adminRepository.updateMachine(id, machineData);
      return { data: machine };
    } catch (error) {
      if (isNotFoundError(error)) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Machine not found'
        });
      }
      request.log.error(error);
      return handleRouteError(error, reply, 'update admin machine');
    }
  });

  fastify.delete('/api/admin/machines/:id', {
    preHandler: [authenticateRequest, requireAdminAccess]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      await adminRepository.deleteMachine(id);
      return reply.status(204).send();
    } catch (error) {
      if (isValidationError(error)) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: (error as Error).message
        });
      }
      request.log.error(error);
      return handleRouteError(error, reply, 'delete admin machine');
    }
  });

  // Admin roaster management
  fastify.get('/api/admin/roasters', {
    preHandler: [authenticateRequest, requireAdminAccess]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const roasters = await adminRepository.getAllRoasters();
      return {
        data: roasters,
        count: roasters.length
      };
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'fetch admin roasters');
    }
  });

  fastify.put('/api/admin/roasters/:id', {
    preHandler: [authenticateRequest, requireAdminAccess]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const roasterData = request.body as any; // TODO: Add proper validation schema

      const roaster = await adminRepository.updateRoaster(id, roasterData);
      return { data: roaster };
    } catch (error) {
      if (isNotFoundError(error)) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Roaster not found'
        });
      }
      request.log.error(error);
      return handleRouteError(error, reply, 'update admin roaster');
    }
  });

  fastify.delete('/api/admin/roasters/:id', {
    preHandler: [authenticateRequest, requireAdminAccess]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      await adminRepository.deleteRoaster(id);
      return reply.status(204).send();
    } catch (error) {
      if (isValidationError(error)) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: (error as Error).message
        });
      }
      request.log.error(error);
      return handleRouteError(error, reply, 'delete admin roaster');
    }
  });
}