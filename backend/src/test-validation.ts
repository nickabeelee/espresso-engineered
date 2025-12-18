// Test validation schemas without requiring database connection
import { validateSchema, createBrewSchema, createBeanSchema, roastLevelSchema } from './validation/schemas.js';

function testValidationSchemas() {
  console.log('Testing validation schemas...');

  // Test 1: Valid brew data
  try {
    const validBrewData = {
      machine_id: '123e4567-e89b-12d3-a456-426614174000',
      grinder_id: '123e4567-e89b-12d3-a456-426614174001',
      bag_id: '123e4567-e89b-12d3-a456-426614174002',
      dose_mg: 18.5,
      yield_mg: 36.0,
      brew_time_ms: 28000,
      rating: 8,
      tasting_notes: 'Bright and fruity',
      reflections: 'Good extraction, maybe grind slightly finer next time'
    };

    const validated = validateSchema(createBrewSchema, validBrewData);
    console.log('✓ Valid brew data validation: PASS');
  } catch (error) {
    console.log('✗ Valid brew data validation: FAIL -', error);
  }

  // Test 2: Invalid UUID
  try {
    const invalidUuidData = {
      machine_id: 'invalid-uuid',
      grinder_id: '123e4567-e89b-12d3-a456-426614174001',
      bag_id: '123e4567-e89b-12d3-a456-426614174002',
      dose_mg: 18.5
    };

    validateSchema(createBrewSchema, invalidUuidData);
    console.log('✗ Invalid UUID validation: FAIL - Should have thrown error');
  } catch (error) {
    console.log('✓ Invalid UUID validation: PASS - Correctly rejected invalid UUID');
  }

  // Test 3: Negative dose
  try {
    const negativeDoseData = {
      machine_id: '123e4567-e89b-12d3-a456-426614174000',
      grinder_id: '123e4567-e89b-12d3-a456-426614174001',
      bag_id: '123e4567-e89b-12d3-a456-426614174002',
      dose_mg: -5
    };

    validateSchema(createBrewSchema, negativeDoseData);
    console.log('✗ Negative dose validation: FAIL - Should have thrown error');
  } catch (error) {
    console.log('✓ Negative dose validation: PASS - Correctly rejected negative dose');
  }

  // Test 4: Valid bean data
  try {
    const validBeanData = {
      roaster_id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Ethiopian Yirgacheffe',
      roast_level: 'Light' as const,
      country_of_origin: 'Ethiopia',
      tasting_notes: 'Floral, citrus, tea-like'
    };

    const validated = validateSchema(createBeanSchema, validBeanData);
    console.log('✓ Valid bean data validation: PASS');
  } catch (error) {
    console.log('✗ Valid bean data validation: FAIL -', error);
  }

  // Test 5: Invalid roast level
  try {
    const invalidRoastData = {
      roaster_id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Bean',
      roast_level: 'Super Dark' // Invalid roast level
    };

    validateSchema(createBeanSchema, invalidRoastData);
    console.log('✗ Invalid roast level validation: FAIL - Should have thrown error');
  } catch (error) {
    console.log('✓ Invalid roast level validation: PASS - Correctly rejected invalid roast level');
  }

  // Test 6: Rating bounds
  try {
    const invalidRatingData = {
      machine_id: '123e4567-e89b-12d3-a456-426614174000',
      grinder_id: '123e4567-e89b-12d3-a456-426614174001',
      bag_id: '123e4567-e89b-12d3-a456-426614174002',
      dose_mg: 18.5,
      rating: 15 // Invalid rating > 10
    };

    validateSchema(createBrewSchema, invalidRatingData);
    console.log('✗ Invalid rating validation: FAIL - Should have thrown error');
  } catch (error) {
    console.log('✓ Invalid rating validation: PASS - Correctly rejected rating > 10');
  }

  console.log('Validation schema tests completed');
}

// Run tests
testValidationSchemas();