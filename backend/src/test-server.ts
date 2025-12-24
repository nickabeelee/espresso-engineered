// Test server setup without requiring database connection
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { errorHandler } from './middleware/error.js';
import { isOriginAllowed, parseAllowedOriginSuffixes } from './utils/origin-validation.js';

async function testServerSetup() {
  console.log('Testing server setup...');

  const fastify = Fastify({
    logger: false // Disable logging for test
  });

  try {
    // Register CORS (suffix-based to match production config).
    const allowedOriginSuffixes = parseAllowedOriginSuffixes();
    await fastify.register(cors, {
      origin: (origin, callback) => {
        const allowed = isOriginAllowed(origin, allowedOriginSuffixes);
        callback(null, allowed);
      },
      credentials: true
    });

    // Register error handler
    fastify.setErrorHandler(errorHandler);

    // Test health endpoint
    fastify.get('/health', async (request, reply) => {
      return { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };
    });

    // Test API info endpoint
    fastify.get('/api', async (request, reply) => {
      return { 
        message: 'Espresso Engineered API', 
        version: '1.0.0'
      };
    });

    // Start server on a test port
    const testPort = 8081;
    await fastify.listen({ port: testPort, host: '127.0.0.1' });
    console.log('✓ Server startup: PASS');

    // Test health endpoint
    const healthResponse = await fetch(`http://127.0.0.1:${testPort}/health`);
    const healthData = await healthResponse.json();
    
    if (healthData.status === 'ok') {
      console.log('✓ Health endpoint: PASS');
    } else {
      console.log('✗ Health endpoint: FAIL');
    }

    // Test API info endpoint
    const apiResponse = await fetch(`http://127.0.0.1:${testPort}/api`);
    const apiData = await apiResponse.json();
    
    if (apiData.message === 'Espresso Engineered API') {
      console.log('✓ API info endpoint: PASS');
    } else {
      console.log('✗ API info endpoint: FAIL');
    }

    // Close server
    await fastify.close();
    console.log('✓ Server shutdown: PASS');

  } catch (error) {
    console.log('✗ Server setup: FAIL -', error);
    await fastify.close();
  }

  console.log('Server setup tests completed');
}

// Run tests
testServerSetup().catch(console.error);
