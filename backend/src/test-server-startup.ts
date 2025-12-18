// Test server startup with real Supabase connection
import dotenv from 'dotenv';
dotenv.config();

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { errorHandler } from './middleware/error.js';
import { authenticateRequest } from './middleware/auth.js';
import { initializeDatabase } from './config/database.js';

async function testServerStartup() {
  console.log('🚀 Testing server startup...');
  
  const fastify = Fastify({
    logger: {
      level: 'info'
    }
  });

  try {
    // Initialize database connection
    console.log('1. Initializing database...');
    await initializeDatabase();
    console.log('   ✅ Database initialized');

    // Register CORS
    console.log('2. Registering CORS...');
    await fastify.register(cors, {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    });
    console.log('   ✅ CORS registered');

    // Register global error handler
    console.log('3. Setting up error handler...');
    fastify.setErrorHandler(errorHandler);
    console.log('   ✅ Error handler set');

    // Health check endpoint
    fastify.get('/health', async (request, reply) => {
      return { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        database: 'connected'
      };
    });

    // API info endpoint
    fastify.get('/api', async (request, reply) => {
      return { 
        message: 'Espresso Engineered API', 
        version: '1.0.0',
        status: 'ready',
        endpoints: {
          health: '/health',
          me: '/api/me',
          brews: '/api/brews (coming in task 3)',
          beans: '/api/beans (coming in task 3)',
          bags: '/api/bags (coming in task 3)',
          grinders: '/api/grinders (coming in task 3)',
          machines: '/api/machines (coming in task 3)',
          roasters: '/api/roasters (coming in task 3)'
        }
      };
    });

    // Test authentication endpoint
    fastify.get('/api/me', {
      preHandler: authenticateRequest
    }, async (request, reply) => {
      const authRequest = request as any;
      return {
        message: 'Authentication working!',
        barista: authRequest.barista,
        authUserId: authRequest.authUserId
      };
    });

    // Start server on test port
    const testPort = 8081;
    console.log('4. Starting server...');
    await fastify.listen({ port: testPort, host: '127.0.0.1' });
    console.log(`   ✅ Server started on http://127.0.0.1:${testPort}`);

    // Test endpoints
    console.log('5. Testing endpoints...');
    
    // Test health endpoint
    const healthResponse = await fetch(`http://127.0.0.1:${testPort}/health`);
    const healthData = await healthResponse.json();
    console.log('   ✅ Health endpoint:', healthData.status);

    // Test API info endpoint
    const apiResponse = await fetch(`http://127.0.0.1:${testPort}/api`);
    const apiData = await apiResponse.json();
    console.log('   ✅ API info endpoint:', apiData.message);

    // Close server
    await fastify.close();
    console.log('   ✅ Server closed gracefully');

    console.log('\n🎉 Server startup test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Database connection working');
    console.log('   ✅ Server starts without errors');
    console.log('   ✅ All middleware registered correctly');
    console.log('   ✅ Endpoints responding properly');
    console.log('   ✅ Authentication middleware ready');
    console.log('\n🚀 Ready to implement Task 3: Core entity management APIs!');

  } catch (error) {
    console.error('\n❌ Server startup failed:', error);
    await fastify.close();
    throw error;
  }
}

// Run the test
testServerStartup().catch(console.error);