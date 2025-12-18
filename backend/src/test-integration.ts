// Integration test for complete user workflows
import 'dotenv/config';
import { supabase } from './config/supabase.js';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, error?: string) {
  results.push({ name, passed, error });
  const icon = passed ? '✓' : '✗';
  console.log(`${icon} ${name}${error ? `: ${error}` : ''}`);
}

async function testIntegration() {
  console.log('=== Integration Testing ===\n');

  // Test 1: Database Connection
  console.log('1. Testing Database Connection...');
  try {
    const { data, error } = await supabase.from('barista').select('count').limit(1);
    if (error) throw error;
    logTest('Database connection', true);
  } catch (error) {
    logTest('Database connection', false, String(error));
  }

  // Test 2: Authentication Service
  console.log('\n2. Testing Authentication Service...');
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    logTest('Auth service accessible', true);
    console.log(`   Found ${data.users.length} users in system`);
  } catch (error) {
    logTest('Auth service accessible', false, String(error));
  }

  // Test 3: Entity Tables Accessibility
  console.log('\n3. Testing Entity Tables...');
  const tables = ['barista', 'bean', 'bag', 'grinder', 'machine', 'roaster', 'brew'];
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1);
      if (error) throw error;
      logTest(`Table ${table} accessible`, true);
    } catch (error) {
      logTest(`Table ${table} accessible`, false, String(error));
    }
  }

  // Test 4: API Endpoints
  console.log('\n4. Testing API Endpoints...');
  try {
    const response = await fetch('http://localhost:8080/health');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    logTest('Health endpoint', data.status === 'ok');
  } catch (error) {
    logTest('Health endpoint', false, String(error));
  }

  // Test 5: CRUD Endpoints (without auth - should fail appropriately)
  console.log('\n5. Testing API Authentication Requirements...');
  const endpoints = [
    { method: 'GET', path: '/api/brews' },
    { method: 'GET', path: '/api/beans' },
    { method: 'GET', path: '/api/bags' },
    { method: 'GET', path: '/api/grinders' },
    { method: 'GET', path: '/api/machines' },
    { method: 'GET', path: '/api/roasters' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:8080${endpoint.path}`);
      // Should return 401 without auth token
      if (response.status === 401) {
        logTest(`${endpoint.method} ${endpoint.path} requires auth`, true);
      } else {
        logTest(`${endpoint.method} ${endpoint.path} requires auth`, false, `Got ${response.status} instead of 401`);
      }
    } catch (error) {
      logTest(`${endpoint.method} ${endpoint.path} requires auth`, false, String(error));
    }
  }

  // Test 6: Data Integrity Checks
  console.log('\n6. Testing Data Integrity...');
  try {
    // Check for orphaned records
    const { data: brews, error: brewError } = await supabase
      .from('brew')
      .select('id, barista_id, machine_id, grinder_id, bag_id')
      .limit(10);
    
    if (brewError) throw brewError;
    
    if (brews && brews.length > 0) {
      // Verify foreign keys exist
      const baristaIds = [...new Set(brews.map(b => b.barista_id))];
      const { data: baristas, error: baristaError } = await supabase
        .from('barista')
        .select('id')
        .in('id', baristaIds);
      
      if (baristaError) throw baristaError;
      
      const foundIds = new Set(baristas?.map(b => b.id) || []);
      const allValid = baristaIds.every(id => foundIds.has(id));
      
      logTest('Foreign key integrity (barista)', allValid);
    } else {
      logTest('Foreign key integrity (barista)', true, 'No brews to check');
    }
  } catch (error) {
    logTest('Foreign key integrity', false, String(error));
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

  return passed === total;
}

// Run tests
testIntegration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Integration test failed:', error);
    process.exit(1);
  });
