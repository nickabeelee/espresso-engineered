import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import { MachineRepository } from '../repositories/index.js';
import { authenticateRequest, AuthenticatedRequest } from '../middleware/auth.js';
import { validateSchema, createMachineSchema } from '../validation/schemas.js';
import { CreateMachineRequest } from '../types/index.js';
import { handleRouteError, isConflictError } from '../utils/error-helpers.js';
import { uploadImage, deleteImage, replaceImage } from '../utils/image-upload.js';

const machineRepository = new MachineRepository();

function mapMachineToApi(machine: any) {
  const { name, ...rest } = machine;
  return { ...rest, model: name };
}

function mapMachineToDb(machine: CreateMachineRequest) {
  return {
    name: machine.model,
    manufacturer: machine.manufacturer,
    user_manual_link: machine.user_manual_link,
    image_path: machine.image_path
  };
}

export async function machineRoutes(fastify: FastifyInstance) {
  // GET /api/machines - List all machines (authenticated access)
  fastify.get('/api/machines', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
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
        data: machines.map(mapMachineToApi),
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

  // GET /api/machines/:id - Get specific machine (authenticated access)
  fastify.get('/api/machines/:id', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      
      const machine = await machineRepository.findById(id);
      
      return { data: mapMachineToApi(machine) };
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
      const machineInsert = mapMachineToDb(machineData);

      // Check if machine name already exists
      const exists = await machineRepository.existsByName(machineInsert.name);
      if (exists) {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'A machine with this name already exists'
        });
      }

      const machine = await machineRepository.create(machineInsert);
      
      return reply.status(201).send({ data: mapMachineToApi(machine) });
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
      const machineData = validateSchema(createMachineSchema.partial(), request.body) as Partial<CreateMachineRequest>;
      const updateData = machineData.model
        ? { ...machineData, name: machineData.model }
        : machineData;
      if ('model' in updateData) {
        delete (updateData as any).model;
      }

      // Check if new name conflicts with existing machine
      if ((updateData as any).name) {
        const exists = await machineRepository.existsByName((updateData as any).name, id);
        if (exists) {
          return reply.status(409).send({
            error: 'Conflict',
            message: 'A machine with this name already exists'
          });
        }
      }

      const machine = await machineRepository.update(id, updateData);
      
      return { data: mapMachineToApi(machine) };
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
      
      // Get machine to check for existing image
      const machine = await machineRepository.findById(id);
      
      // Delete the machine record
      await machineRepository.delete(id);
      
      // Delete associated image if it exists
      if (machine.image_path) {
        try {
          await deleteImage(machine.image_path, 'machine');
        } catch (error) {
          // Log error but don't fail the operation
          request.log.warn(`Failed to delete machine image ${machine.image_path}: ${String(error)}`);
        }
      }
      
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

  // POST /api/machines/:id/image - Upload machine image (authenticated)
  fastify.post('/api/machines/:id/image', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      
      // Get the uploaded file
      const data: MultipartFile | undefined = await (request as any).file();
      if (!data) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'No file uploaded'
        });
      }

      // Convert file stream to buffer
      const buffer = await data.toBuffer();
      
      // Get current machine to check for existing image
      const machine = await machineRepository.findById(id);
      
      // Upload new image (and delete old one if it exists)
      const uploadResult = await replaceImage(
        machine.image_path || null,
        buffer,
        data.filename,
        'machine'
      );

      // Update machine with new image path
      const updatedMachine = await machineRepository.update(id, {
        image_path: uploadResult.path
      });

      return {
        data: mapMachineToApi(updatedMachine),
        image_url: uploadResult.publicUrl
      };
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'upload machine image');
    }
  });

  // DELETE /api/machines/:id/image - Delete machine image (authenticated)
  fastify.delete('/api/machines/:id/image', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      
      // Get current machine
      const machine = await machineRepository.findById(id);
      
      if (!machine.image_path) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'No image found for this machine'
        });
      }

      // Delete image from storage
      await deleteImage(machine.image_path, 'machine');

      // Update machine to remove image path
      const updatedMachine = await machineRepository.update(id, {
        image_path: undefined
      });

      return { data: mapMachineToApi(updatedMachine) };
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'delete machine image');
    }
  });
}
