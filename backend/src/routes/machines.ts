import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MachineRepository } from '../repositories/index.js';
import { authenticateRequest, AuthenticatedRequest } from '../middleware/auth.js';
import { validateSchema, createMachineSchema } from '../validation/schemas.js';
import { CreateMachineRequest } from '../types/index.js';
import { handleRouteError, isConflictError } from '../utils/error-helpers.js';

const machineRepository = new MachineRepository();

export async function machineRoutes(fastify: FastifyInstance) {
  // GET /api/machines - List all machines (public access)
  fastify.get('/api/machines', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { manufacturer, search } = request.query as { 
        manufacturer?: string;
        search?: string;
      };
      
      let machines;
      if (search) {
        machines = await machineRepository.search(search);
      } else if (manufacturer) {
        machines = await machineRepository.findByManufacturer(manufacturer);
      } else {
        machines = await machineRepository.findMany();
      }

      return {
        data: machines,
        count: machines.length
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch machines'
      });
    }
  });

  // GET /api/machines/:id - Get specific machine (public access)
  fastify.get('/api/machines/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      
      const machine = await machineRepository.findById(id);
      
      return { data: machine };
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'fetch machine');
    }
  });

  // POST /api/machines - Create new machine (authenticated)
  fastify.post('/api/machines', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      const machineData = validateSchema(createMachineSchema, request.body) as CreateMachineRequest;

      // Check if machine name already exists
      const exists = await machineRepository.existsByName(machineData.name);
      if (exists) {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'A machine with this name already exists'
        });
      }

      const machine = await machineRepository.create(machineData);
      
      return reply.status(201).send({ data: machine });
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'create machine');
    }
  });

  // PUT /api/machines/:id - Update machine (authenticated)
  fastify.put('/api/machines/:id', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const machineData = validateSchema(createMachineSchema.partial(), request.body);

      // Check if new name conflicts with existing machine
      if (machineData.name) {
        const exists = await machineRepository.existsByName(machineData.name, id);
        if (exists) {
          return reply.status(409).send({
            error: 'Conflict',
            message: 'A machine with this name already exists'
          });
        }
      }

      const machine = await machineRepository.update(id, machineData);
      
      return { data: machine };
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'update machine');
    }
  });

  // DELETE /api/machines/:id - Delete machine (authenticated)
  fastify.delete('/api/machines/:id', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      
      await machineRepository.delete(id);
      
      return reply.status(204).send();
    } catch (error) {
      if (isConflictError(error)) {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'Cannot delete machine: it is referenced by existing brews'
        });
      }
      
      request.log.error(error);
      return handleRouteError(error, reply, 'delete machine');
    }
  });
}