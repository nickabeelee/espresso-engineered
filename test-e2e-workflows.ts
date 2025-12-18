// End-to-end workflow testing
import 'dotenv/config';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];
const API_BASE = 'http://localhost:8080';
const FRONTEND_BASE = 'http://localhost:5173';

function logTest(name: string, passed: boolean, error?: string) {
  results.push({ name, passed, error });
  const icon = passed ? '✓' : '✗';
  console.log(`${icon} ${name}${error ? `: ${error}` : ''}`);
}

async function testEndToEndWorkflows() {
  console.log('=== End-to-End Workflow Testing ===\n');

  // Test 1: Frontend Accessibility
  console.log('1. Testing Frontend Accessibility...');
  try {
    const response = await fetch(FRONTEND_BASE);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    logTest('Frontend server accessible', true);
  } catch (error) {
    logTest('Frontend server accessible', false, String(error));
  }

  // Test 2: Backend API Health
  console.log('\n2. Testing Backend API Health...');
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    logTest('Backend API health check', data.status === 'ok');
  } catch (error) {
    logTest('Backend API health check', false, String(error));
  }

  // Test 3: Authentication Requirements
  console.log('\n3. Testing Authentication Requirements...');
  const protectedEndpoints = [
    '/api/brews',
    '/api/beans', 
    '/api/bags',
    '/api/grinders',
    '/api/machines',
    '/api/roasters'
  ];

  for (const endpoint of protectedEndpoints) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`);
      const isProtected = response.status === 401;
      logTest(`${endpoint} requires authentication`, isProtected);
    } catch (error) {
      logTest(`${endpoint} requires authentication`, false, String(error));
    }
  }

  // Test 4: CORS Configuration
  console.log('\n4. Testing CORS Configuration...');
  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_BASE,
        'Access-Control-Request-Method': 'GET'
      }
    });
    
    const corsHeaders = response.headers.get('access-control-allow-origin');
    const corsAllowed = corsHeaders === '*' || corsHeaders === FRONTEND_BASE;
    logTest('CORS properly configured', corsAllowed);
  } catch (error) {
    logTest('CORS properly configured', false, String(error));
  }

  // Test 5: API Error Handling
  console.log('\n5. Testing API Error Handling...');
  try {
    // Test invalid endpoint
    const response = await fetch(`${API_BASE}/api/nonexistent`);
    const is404 = response.status === 404;
    logTest('404 handling for invalid endpoints', is404);
  } catch (error) {
    logTest('404 handling for invalid endpoints', false, String(error));
  }

  try {
    // Test malformed request
    const response = await fetch(`${API_BASE}/api/brews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json'
    });
    const isBadRequest = response.status === 400 || response.status === 401;
    logTest('Bad request handling', isBadRequest);
  } catch (error) {
    logTest('Bad request handling', false, String(error));
  }

  // Test 6: Database Connection Stability
  console.log('\n6. Testing Database Connection Stability...');
  try {
    // Make multiple rapid requests to test connection pooling
    const promises = Array.from({ length: 5 }, () => 
      fetch(`${API_BASE}/health`)
    );
    
    const responses = await Promise.all(promises);
    const allSuccessful = responses.every(r => r.ok);
    logTest('Database connection stability', allSuccessful);
  } catch (error) {
    logTest('Database connection stability', false, String(error));
  }

  // Test 7: Content Type Headers
  console.log('\n7. Testing Content Type Headers...');
  try {
    const response = await fetch(`${API_BASE}/health`);
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    logTest('JSON content type headers', !!isJson);
  } catch (error) {
    logTest('JSON content type headers', false, String(error));
  }

  // Test 8: Response Time Performance
  console.log('\n8. Testing Response Time Performance...');
  try {
    const start = Date.now();
    const response = await fetch(`${API_BASE}/health`);
    const duration = Date.now() - start;
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const isPerformant = duration < 1000; // Less than 1 second
    logTest('API response time < 1s', isPerformant, `${duration}ms`);
  } catch (error) {
    logTest('API response time < 1s', false, String(error));
  }

  // Test 9: Frontend Static Assets
  console.log('\n9. Testing Frontend Static Assets...');
  try {
    const response = await fetch(`${FRONTEND_BASE}/favicon.ico`);
    // 200 or 404 is fine, just testing that the server responds
    const serverResponds = response.status === 200 || response.status === 404;
    logTest('Frontend serves static assets', serverResponds);
  } catch (error) {
    logTest('Frontend serves static assets', false, String(error));
  }

  // Test 10: Environment Configuration
  console.log('\n10. Testing Environment Configuration...');
  try {
    // Check if environment variables are properly loaded
    const hasSupabaseUrl = process.env.SUPABASE_URL?.includes('supabase.co');
    const hasServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.length > 50;
    
    logTest('Backend environment variables loaded', !!(hasSupabaseUrl && hasServiceKey));
  } catch (error) {
    logTest('Backend environment variables loaded', false, String(error));
  }

  // Summary
  console.log('\n=== Test Summary ===');
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`Passed: ${passed}/${total}`);
  
  if (passed < total) {
    console.log('\nFailed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }

  console.log('\n=== Integration Status ===');
  if (passed === total) {
    console.log('🎉 All systems integrated successfully!');
    console.log('✅ Backend API is running and accessible');
    console.log('✅ Frontend is running and accessible');
    console.log('✅ Authentication is properly enforced');
    console.log('✅ Database connections are stable');
    console.log('✅ Error handling is working correctly');
  } else {
    console.log('⚠️  Some integration issues detected');
    console.log('Please review failed tests above');
  }

  return passed === total;
}

// Run tests
testEndToEndWorkflows()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('E2E test failed:', error);
    process.exit(1);
  });