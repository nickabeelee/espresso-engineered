import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';

const fastify = Fastify({
  logger: true
});

// Start server
const start = async () => {
  try {
    // Register CORS
    await fastify.register(cors, {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    });

    // Register JWT
    await fastify.register(jwt, {
      secret: process.env.JWT_SECRET || 'your-secret-key'
    });

    // Basic health check endpoint
    fastify.get('/health', async (request, reply) => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // API routes will be added in later tasks
    fastify.get('/api', async (request, reply) => {
      return { message: 'Espresso Engineered API', version: '1.0.0' };
    });

    const port = parseInt(process.env.PORT || '8080');
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    console.log(`Server listening on ${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();