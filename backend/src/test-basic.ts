// Basic functionality test for the backend API foundation
import { supabase } from './config/supabase.js';
import { testDatabaseConnection } from './config/database.js';
import { validateSchema, createBrewSchema } from './validation/schemas.js';

async function testBasicFunctionality() {
  console.log('Testing backend API foundation...');

  // Test 1: Database connection
  try {
    const isConnected = await testDatabaseConnection();
    console.log('✓ Database connection test:', isConnected ? 'PASS' : 'FAIL');
  } catch (error) {
    console.log('✗ Database connection test: FAIL -', error);
  }

  // Test 2: Validation schemas
  try {
    const validBrewData = {
      machine_id: '123e4567-e89b-12d3-a456-426614174000',
      grinder_id: '123e4567-e89b-12d3-a456-426614174001',
      bag_id: '123e4567-e89b-12d3-a456-426614174002',
      dose_g: 18.5,
      yield_g: 36.0,
      brew_time_s: 28.0,
      rating: 8
    };

    const validated = validateSchema(createBrewSchema, validBrewData);
    console.log('✓ Validation schema test: PASS');
  } catch (error) {
    console.log('✗ Validation schema test: FAIL -', error);
  }

  // Test 3: Invalid validation
  try {
    const invalidBrewData = {
      machine_id: 'invalid-uuid',
      dose_g: -5 // Invalid negative number
    };

    validateSchema(createBrewSchema, invalidBrewData);
    console.log('✗ Invalid validation test: FAIL - Should have thrown error');
  } catch (error) {
    console.log('✓ Invalid validation test: PASS - Correctly rejected invalid data');
  }

  console.log('Basic functionality tests completed');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testBasicFunctionality().catch(console.error);
}

export { testBasicFunctionality };