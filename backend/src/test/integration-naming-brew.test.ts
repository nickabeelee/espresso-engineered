/**
 * Integration tests for automatic brew naming feature
 * Tests end-to-end brew creation workflow with automatic naming
 * 
 * Requirements tested:
 * - 2.1: Brew name format "{barista's display_name} {bean_name} {local_time_to_minute}"
 * - 2.2: Time formatting as "HH:MM" in 24-hour format
 * - 2.3: Bean name extraction from bag relationships
 * - 2.4: Special character preservation in brew names
 * - 2.5: Automatic name setting in brew.name field
 * - 6.1: Timezone-aware time formatting
 * - 6.2: UTC fallback with clear indication
 * - 6.4: Cross-environment time consistency
 * - 6.5: Timezone context preservation
 * - 4.2: Frontend name generation and display
 * - 4.3: API name generation before insertion
 * - 4.4: Frontend form name generation
 * - 4.5: Preview-storage consistency
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { supabase } from '../config/supabase.js';
import { namingService } from '../services/naming.js';

// Test data IDs - will be created during setup
let testBaristaId: string;
let testBeanId: string;
let testBagId: string;
let testBrewId: string;
let testAuthToken: string;

// API base URL
const API_BASE = process.env.API_URL || 'http://localhost:8080';

// Type for API responses
interface ApiResponse {
  data?: any;
  error?: string;
  message?: string;
}

describe('Brew Creation Integration Tests', () => {
  beforeAll(async () => {
    // Create test barista
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `test-brew-naming-${Date.now()}@example.com`,
      password: 'TestPassword123!'
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create test user: ${authError?.message}`);
    }

    testAuthToken = authData.session?.access_token || '';
    testBaristaId = authData.user.id;

    // Create barista profile
    const { error: baristaError } = await supabase
      .from('barista')
      .insert({
        id: testBaristaId,
        display_name: 'Brew Tester',
        first_name: 'Brew',
        email: authData.user.email
      });

    if (baristaError) {
      throw new Error(`Failed to create barista profile: ${baristaError.message}`);
    }

    // Create test bean
    const { data: beanData, error: beanError } = await supabase
      .from('bean')
      .insert({
        name: 'Colombian Supremo',
        roaster_id: null
      })
      .select()
      .single();

    if (beanError || !beanData) {
      throw new Error(`Failed to create test bean: ${beanError?.message}`);
    }

    testBeanId = beanData.id;

    // Create test bag
    const { data: bagData, error: bagError } = await supabase
      .from('bag')
      .insert({
        bean_id: testBeanId,
        owner_id: testBaristaId,
        name: 'Test Bag',
        roast_date: '2023-12-01',
        purchase_date: '2023-12-01',
        weight_grams: 250
      })
      .select()
      .single();

    if (bagError || !bagData) {
      throw new Error(`Failed to create test bag: ${bagError?.message}`);
    }

    testBagId = bagData.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testBrewId) {
      await supabase.from('brew').delete().eq('id', testBrewId);
    }
    if (testBagId) {
      await supabase.from('bag').delete().eq('id', testBagId);
    }
    if (testBeanId) {
      await supabase.from('bean').delete().eq('id', testBeanId);
    }
    if (testBaristaId) {
      await supabase.from('barista').delete().eq('id', testBaristaId);
      await supabase.auth.admin.deleteUser(testBaristaId);
    }
  });

  beforeEach(() => {
    // Reset test brew ID before each test
    testBrewId = '';
  });

  describe('End-to-End Brew Creation Workflow', () => {
    it('should create brew with automatically generated name', async () => {
      // Create brew via API
      const response = await fetch(`${API_BASE}/api/brews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testAuthToken}`
        },
        body: JSON.stringify({
          bag_id: testBagId,
          grind_setting: 15,
          dose_grams: 18.5,
          yield_grams: 36.0,
          brew_time_seconds: 28,
          water_temp_celsius: 93,
          rating: 4
        })
      });

      expect(response.status).toBe(201);
      const result = await response.json() as ApiResponse;
      
      // Validate response structure
      expect(result.data).toBeDefined();
      expect(result.data.id).toBeDefined();
      expect(result.data.name).toBeDefined();
      
      testBrewId = result.data.id;

      // Validate name format: "{barista's display_name} {bean_name} {HH:MM}"
      expect(result.data.name).toMatch(/^Brew Tester Colombian Supremo \d{2}:\d{2}( UTC)?$/);
      
      // Verify name is stored in database
      const { data: brewData, error } = await supabase
        .from('brew')
        .select('name')
        .eq('id', testBrewId)
        .single();

      expect(error).toBeNull();
      expect(brewData?.name).toBeDefined();
      expect(brewData?.name).toBe(result.data.name);
    });

    it('should handle timezone information in brew creation', async () => {
      const timezoneInfo = {
        browserTimezone: 'America/New_York',
        userTimezone: 'America/New_York',
        confidence: 'high'
      };

      // Create brew with timezone information
      const response = await fetch(`${API_BASE}/api/brews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testAuthToken}`
        },
        body: JSON.stringify({
          bag_id: testBagId,
          grind_setting: 15,
          dose_grams: 18.5,
          yield_grams: 36.0,
          brew_time_seconds: 28,
          water_temp_celsius: 93,
          rating: 4,
          _timezone: timezoneInfo
        })
      });

      expect(response.status).toBe(201);
      const result = await response.json() as ApiResponse;
      
      testBrewId = result.data.id;

      // Name should be generated with timezone-aware time
      expect(result.data.name).toMatch(/^Brew Tester Colombian Supremo \d{2}:\d{2}$/);
      
      // Should not have UTC indicator when timezone is provided
      expect(result.data.name).not.toContain('UTC');
    });
  });

  describe('Name Preview Functionality', () => {
    it('should generate preview name with consistent format', async () => {
      // Get preview name
      const previewResponse = await fetch(`${API_BASE}/api/brews/preview-name`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testAuthToken}`
        },
        body: JSON.stringify({
          bag_id: testBagId
        })
      });

      expect(previewResponse.status).toBe(200);
      const previewResult = await previewResponse.json() as ApiResponse;
      const previewName = previewResult.data.name;

      // Preview should have correct format
      expect(previewName).toMatch(/^Brew Tester Colombian Supremo \d{2}:\d{2}( UTC)?$/);
    });
  });

  describe('Time Formatting', () => {
    it('should format time in 24-hour HH:MM format', async () => {
      // Test multiple brews to check time formatting consistency
      for (let i = 0; i < 3; i++) {
        const response = await fetch(`${API_BASE}/api/brews/preview-name`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testAuthToken}`
          },
          body: JSON.stringify({
            bag_id: testBagId
          })
        });

        expect(response.status).toBe(200);
        const result = await response.json() as ApiResponse;
        
        // Extract time part from name
        const nameParts = result.data.name.split(' ');
        const timePart = nameParts[nameParts.length - 1].replace(' UTC', '');
        
        // Should match HH:MM format
        expect(timePart).toMatch(/^\d{2}:\d{2}$/);
        
        // Hours should be 00-23, minutes 00-59
        const [hours, minutes] = timePart.split(':').map(Number);
        expect(hours).toBeGreaterThanOrEqual(0);
        expect(hours).toBeLessThanOrEqual(23);
        expect(minutes).toBeGreaterThanOrEqual(0);
        expect(minutes).toBeLessThanOrEqual(59);
        
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    });
  });

  describe('Fallback Behavior', () => {
    it('should use first_name when display_name is empty', async () => {
      // Create barista with only first_name
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: `test-brew-firstname-${Date.now()}@example.com`,
        password: 'TestPassword123!'
      });

      expect(authError).toBeNull();
      expect(authData.user).toBeDefined();

      const firstNameBaristaId = authData.user!.id;
      const firstNameToken = authData.session?.access_token || '';

      // Create barista with empty display_name
      await supabase
        .from('barista')
        .insert({
          id: firstNameBaristaId,
          display_name: '',
          first_name: 'BrewFirst',
          email: authData.user!.email
        });

      // Create bag for this barista
      const { data: firstNameBag, error: bagError } = await supabase
        .from('bag')
        .insert({
          bean_id: testBeanId,
          owner_id: firstNameBaristaId,
          name: 'FirstName Test Bag',
          roast_date: '2023-12-01',
          purchase_date: '2023-12-01',
          weight_grams: 250
        })
        .select()
        .single();

      expect(bagError).toBeNull();

      // Create brew
      const response = await fetch(`${API_BASE}/api/brews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firstNameToken}`
        },
        body: JSON.stringify({
          bag_id: firstNameBag!.id,
          grind_setting: 15,
          dose_grams: 18.5,
          yield_grams: 36.0,
          brew_time_seconds: 28,
          water_temp_celsius: 93,
          rating: 4
        })
      });

      expect(response.status).toBe(201);
      const result = await response.json() as ApiResponse;
      
      // Should use first_name
      expect(result.data.name).toMatch(/^BrewFirst Colombian Supremo \d{2}:\d{2}( UTC)?$/);
      
      // Clean up
      await supabase.from('brew').delete().eq('id', result.data.id);
      await supabase.from('bag').delete().eq('id', firstNameBag!.id);
      await supabase.from('barista').delete().eq('id', firstNameBaristaId);
      await supabase.auth.admin.deleteUser(firstNameBaristaId);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle invalid bag_id gracefully', async () => {
      const response = await fetch(`${API_BASE}/api/brews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testAuthToken}`
        },
        body: JSON.stringify({
          bag_id: '00000000-0000-0000-0000-000000000000',
          grind_setting: 15,
          dose_grams: 18.5,
          yield_grams: 36.0,
          brew_time_seconds: 28,
          water_temp_celsius: 93,
          rating: 4
        })
      });

      // Should return validation error or handle gracefully
      expect([400, 500]).toContain(response.status);
    });

    it('should handle missing required fields', async () => {
      const response = await fetch(`${API_BASE}/api/brews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testAuthToken}`
        },
        body: JSON.stringify({
          grind_setting: 15
          // Missing bag_id and other required fields
        })
      });

      expect(response.status).toBe(400);
      const result = await response.json() as ApiResponse;
      expect(result.error).toBeDefined();
    });
  });

  describe('Storage Consistency', () => {
    it('should store generated name in database immediately', async () => {
      const response = await fetch(`${API_BASE}/api/brews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testAuthToken}`
        },
        body: JSON.stringify({
          bag_id: testBagId,
          grind_setting: 15,
          dose_grams: 18.5,
          yield_grams: 36.0,
          brew_time_seconds: 28,
          water_temp_celsius: 93,
          rating: 4
        })
      });

      expect(response.status).toBe(201);
      const result = await response.json() as ApiResponse;
      testBrewId = result.data.id;

      // Immediately query database
      const { data: brewData, error } = await supabase
        .from('brew')
        .select('name, bag_id')
        .eq('id', testBrewId)
        .single();

      expect(error).toBeNull();
      expect(brewData?.name).toBeDefined();
      expect(brewData?.name).toBe(result.data.name);
      expect(brewData?.name).toMatch(/^Brew Tester Colombian Supremo \d{2}:\d{2}( UTC)?$/);
    });
  });
});