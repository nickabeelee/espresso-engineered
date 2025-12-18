import dotenv from 'dotenv';
dotenv.config();

import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { errorHandler } from './middleware/error.js';
import { authenticateRequest, optionalAuthentication } from './middleware/auth.js';
import { initializeDatabase } from './config/database.js';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info'
  }
});

// Start server
const start = async () => {
  try {
    // Initialize database connection
    await initializeDatabase();

    // Register CORS
    await fastify.register(cors, {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    });

    // Register multipart support for file uploads
    await fastify.register(multipart, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1 // Only allow 1 file per request
      }
    });

    // Register global error handler
    fastify.setErrorHandler(errorHandler);

    // Health check endpoint (no auth required)
    fastify.get('/health', async (request, reply) => {
      return { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };
    });

    // API info endpoint (no auth required)
    fastify.get('/api', async (request, reply) => {
      return { 
        message: 'Espresso Engineered API', 
        version: '1.0.0',
        endpoints: {
          health: '/health',
          brews: '/api/brews',
          beans: '/api/beans',
          bags: '/api/bags',
          grinders: '/api/grinders',
          machines: '/api/machines',
          roasters: '/api/roasters'
        }
      };
    });

    // Test authentication endpoint
    fastify.get('/api/me', {
      preHandler: authenticateRequest
    }, async (request, reply) => {
      const authRequest = request as any;
      return {
        barista: authRequest.barista,
        authUserId: authRequest.authUserId
      };
    });

    // Register entity management routes
    const { roasterRoutes } = await import('./routes/roasters.js');
    const { beanRoutes } = await import('./routes/beans.js');
    const { grinderRoutes } = await import('./routes/grinders.js');
    const { machineRoutes } = await import('./routes/machines.js');
    const { bagRoutes } = await import('./routes/bags.js');
    const { brewRoutes } = await import('./routes/brews.js');
    const { adminRoutes } = await import('./routes/admin.js');

    await fastify.register(roasterRoutes);
    await fastify.register(beanRoutes);
    await fastify.register(grinderRoutes);
    await fastify.register(machineRoutes);
    await fastify.register(bagRoutes);
    await fastify.register(brewRoutes);
    await fastify.register(adminRoutes);

    const port = parseInt(process.env.PORT || '8080');
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    console.log(`Server listening on ${host}:${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();