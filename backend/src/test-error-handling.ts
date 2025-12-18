// Test error handling middleware
import Fastify from 'fastify';
import { errorHandler, ValidationError, NotFoundError, ForbiddenError, ConflictError } from './middleware/error.js';
import { ZodError, z } from 'zod';

async function testErrorHandling() {
  console.log('Testing error handling middleware...');

  const fastify = Fastify({
    logger: false
  });

  // Register error handler
  fastify.setErrorHandler(errorHandler);

  // Test endpoints that throw different types of errors
  fastify.get('/test/validation-error', async (request, reply) => {
    throw new ValidationError('Test validation error');
  });

  fastify.get('/test/not-found-error', async (request, reply) => {
    throw new NotFoundError('Test not found error');
  });

  fastify.get('/test/forbidden-error', async (request, reply) => {
    throw new ForbiddenError('Test forbidden error');
  });

  fastify.get('/test/conflict-error', async (request, reply) => {
    throw new ConflictError('Test conflict error');
  });

  fastify.get('/test/zod-error', async (request, reply) => {
    const schema = z.object({
      name: z.string(),
      age: z.number()
    });
    
    // This will throw a ZodError
    schema.parse({ name: 123, age: 'invalid' });
  });

  fastify.get('/test/generic-error', async (request, reply) => {
    throw new Error('Generic test error');
  });

  const testPort = 8082;
  
  try {
    await fastify.listen({ port: testPort, host: '127.0.0.1' });

    // Test ValidationError (400)
    const validationResponse = await fetch(`http://127.0.0.1:${testPort}/test/validation-error`);
    if (validationResponse.status === 400) {
      console.log('✓ ValidationError handling: PASS');
    } else {
      console.log('✗ ValidationError handling: FAIL - Expected 400, got', validationResponse.status);
    }

    // Test NotFoundError (404)
    const notFoundResponse = await fetch(`http://127.0.0.1:${testPort}/test/not-found-error`);
    if (notFoundResponse.status === 404) {
      console.log('✓ NotFoundError handling: PASS');
    } else {
      console.log('✗ NotFoundError handling: FAIL - Expected 404, got', notFoundResponse.status);
    }

    // Test ForbiddenError (403)
    const forbiddenResponse = await fetch(`http://127.0.0.1:${testPort}/test/forbidden-error`);
    if (forbiddenResponse.status === 403) {
      console.log('✓ ForbiddenError handling: PASS');
    } else {
      console.log('✗ ForbiddenError handling: FAIL - Expected 403, got', forbiddenResponse.status);
    }

    // Test ConflictError (409)
    const conflictResponse = await fetch(`http://127.0.0.1:${testPort}/test/conflict-error`);
    if (conflictResponse.status === 409) {
      console.log('✓ ConflictError handling: PASS');
    } else {
      console.log('✗ ConflictError handling: FAIL - Expected 409, got', conflictResponse.status);
    }

    // Test ZodError (400 with details)
    const zodResponse = await fetch(`http://127.0.0.1:${testPort}/test/zod-error`);
    const zodData = await zodResponse.json();
    if (zodResponse.status === 400 && zodData.error === 'Validation Error' && zodData.details) {
      console.log('✓ ZodError handling: PASS');
    } else {
      console.log('✗ ZodError handling: FAIL - Expected 400 with details');
    }

    // Test generic error (500)
    const genericResponse = await fetch(`http://127.0.0.1:${testPort}/test/generic-error`);
    if (genericResponse.status === 500) {
      console.log('✓ Generic error handling: PASS');
    } else {
      console.log('✗ Generic error handling: FAIL - Expected 500, got', genericResponse.status);
    }

    await fastify.close();
    console.log('✓ Error handling server shutdown: PASS');

  } catch (error) {
    console.log('✗ Error handling test setup: FAIL -', error);
    await fastify.close();
  }

  console.log('Error handling tests completed');
}

// Run tests
testErrorHandling().catch(console.error);