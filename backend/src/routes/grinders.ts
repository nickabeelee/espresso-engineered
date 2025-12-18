import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import { GrinderRepository } from '../repositories/index.js';
import { authenticateRequest, AuthenticatedRequest } from '../middleware/auth.js';
import { validateSchema, createGrinderSchema } from '../validation/schemas.js';
import { CreateGrinderRequest } from '../types/index.js';
import { handleRouteError, isConflictError } from '../utils/error-helpers.js';
import { uploadImage, deleteImage, replaceImage } from '../utils/image-upload.js';

const grinderRepository = new GrinderRepository();

export async function grinderRoutes(fastify: FastifyInstance) {
  // GET /api/grinders - List all grinders (authenticated access)
  fastify.get('/api/grinders', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { manufacturer, search } = request.query as { 
        manufacturer?: string;
        search?: string;
      };
      
      let grinders;
      if (search) {
        grinders = await grinderRepository.search(search);
      } else if (manufacturer) {
        grinders = await grinderRepository.findByManufacturer(manufacturer);
      } else {
        grinders = await grinderRepository.findMany();
      }

      return {
        data: grinders,
        count: grinders.length
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch grinders'
      });
    }
  });

  // GET /api/grinders/:id - Get specific grinder (authenticated access)
  fastify.get('/api/grinders/:id', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      
      const grinder = await grinderRepository.findById(id);
      
      return { data: grinder };
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'fetch grinder');
    }
  });

  // POST /api/grinders - Create new grinder (authenticated)
  fastify.post('/api/grinders', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authRequest = request as AuthenticatedRequest;
      const grinderData = validateSchema(createGrinderSchema, request.body) as CreateGrinderRequest;

      // Check if grinder name already exists
      const exists = await grinderRepository.existsByName(grinderData.name);
      if (exists) {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'A grinder with this name already exists'
        });
      }

      const grinder = await grinderRepository.create(grinderData);
      
      return reply.status(201).send({ data: grinder });
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'create grinder');
    }
  });

  // PUT /api/grinders/:id - Update grinder (authenticated)
  fastify.put('/api/grinders/:id', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const grinderData = validateSchema(createGrinderSchema.partial(), request.body);

      // Check if new name conflicts with existing grinder
      if (grinderData.name) {
        const exists = await grinderRepository.existsByName(grinderData.name, id);
        if (exists) {
          return reply.status(409).send({
            error: 'Conflict',
            message: 'A grinder with this name already exists'
          });
        }
      }

      const grinder = await grinderRepository.update(id, grinderData);
      
      return { data: grinder };
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'update grinder');
    }
  });

  // DELETE /api/grinders/:id - Delete grinder (authenticated)
  fastify.delete('/api/grinders/:id', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      
      // Get grinder to check for existing image
      const grinder = await grinderRepository.findById(id);
      
      // Delete the grinder record
      await grinderRepository.delete(id);
      
      // Delete associated image if it exists
      if (grinder.image_path) {
        try {
          await deleteImage(grinder.image_path, 'grinder');
        } catch (error) {
          // Log error but don't fail the operation
          request.log.warn(`Failed to delete grinder image ${grinder.image_path}: ${String(error)}`);
        }
      }
      
      return reply.status(204).send();
    } catch (error) {
      if (isConflictError(error)) {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'Cannot delete grinder: it is referenced by existing brews'
        });
      }
      
      request.log.error(error);
      return handleRouteError(error, reply, 'delete grinder');
    }
  });

  // POST /api/grinders/:id/image - Upload grinder image (authenticated)
  fastify.post('/api/grinders/:id/image', {
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
      
      // Get current grinder to check for existing image
      const grinder = await grinderRepository.findById(id);
      
      // Upload new image (and delete old one if it exists)
      const uploadResult = await replaceImage(
        grinder.image_path || null,
        buffer,
        data.filename,
        'grinder'
      );

      // Update grinder with new image path
      const updatedGrinder = await grinderRepository.update(id, {
        image_path: uploadResult.path
      });

      return {
        data: updatedGrinder,
        image_url: uploadResult.publicUrl
      };
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'upload grinder image');
    }
  });

  // DELETE /api/grinders/:id/image - Delete grinder image (authenticated)
  fastify.delete('/api/grinders/:id/image', {
    preHandler: authenticateRequest
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      
      // Get current grinder
      const grinder = await grinderRepository.findById(id);
      
      if (!grinder.image_path) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'No image found for this grinder'
        });
      }

      // Delete image from storage
      await deleteImage(grinder.image_path, 'grinder');

      // Update grinder to remove image path
      const updatedGrinder = await grinderRepository.update(id, {
        image_path: undefined
      });

      return { data: updatedGrinder };
    } catch (error) {
      request.log.error(error);
      return handleRouteError(error, reply, 'delete grinder image');
    }
  });
}