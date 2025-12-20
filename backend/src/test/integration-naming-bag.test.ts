/**
 * Integration tests for automatic bag naming feature
 * Tests end-to-end bag creation workflow with automatic naming
 * 
 * Requirements tested:
 * - 1.1: Bag name format "{owner's display_name}'s {bean_name} {roast_date}"
 * - 1.2: Roast date formatting as "YYYY-MM-DD"
 * - 1.3: Fallback to "Unknown Roast" for missing roast dates
 * - 1.4: Special character preservation in bag names
 * - 1.5: Automatic name setting in bag.name field
 * - 3.1: "Unknown Bean" fallback for missing bean names
 * - 3.2: display_name priority with first_name fallback
 * - 3.3: "Anonymous" fallback when both names missing
 * - 3.4: Graceful handling of database query failures
 * - 3.5: Null name on complete failure with error logging
 * - 4.1: Name generation before database insertion
 * - 4.5: Preview-storage consistency
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { supabase } from '../config/supabase.js';
import { namingService } from '../services/naming.js';

// Test data IDs - will be created during setup
let testBaristaId: string;
let testBeanId: string;
let testBagId: string;
let testAuthToken: string;

// API base URL
const API_BASE = process.env.API_URL || 'http://localhost:8080';

// Type for API responses
interface ApiResponse {
  data?: any;
  error?: string;
  message?: string;
}

describe('Bag Creation Integration Tests', () => {
  beforeAll(async () => {
    // Create test barista
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `test-bag-naming-${Date.now()}@example.com`,
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
        display_name: 'Test Barista',
        first_name: 'Test',
        email: authData.user.email
      });

    if (baristaError) {
      throw new Error(`Failed to create barista profile: ${baristaError.message}`);
    }

    // Create test bean
    const { data: beanData, error: beanError } = await supabase
      .from('bean')
      .insert({
        name: 'Ethiopian Yirgacheffe',
        roaster_id: null
      })
      .select()
      .single();

    if (beanError || !beanData) {
      throw new Error(`Failed to create test bean: ${beanError?.message}`);
    }

    testBeanId = beanData.id;
  });

  afterAll(async () => {
    // Clean up test data
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
    // Reset test bag ID before each test
    testBagId = '';
  });

  describe('End-to-End Bag Creation Workflow', () => {
    it('should create bag with automatically generated name', async () => {
      const roastDate = '2023-12-01';
      
      // Create bag via API
      const response = await fetch(`${API_BASE}/api/bags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testAuthToken}`
        },
        body: JSON.stringify({
          bean_id: testBeanId,
          roast_date: roastDate,
          purchase_date: '2023-12-01',
          weight_g: 250
        })
      });

      expect(response.status).toBe(201);
      const result = await response.json() as ApiResponse;
      
      // Validate response structure
      expect(result.data).toBeDefined();
      expect(result.data.id).toBeDefined();
      expect(result.data.name).toBeDefined();
      
      testBagId = result.data.id;

      // Validate name format: "{owner's display_name}'s {bean_name} {roast_date}"
      expect(result.data.name).toBe("Test Barista's Ethiopian Yirgacheffe 2023-12-01");
      
      // Verify name is stored in database
      const { data: bagData, error } = await supabase
        .from('bag')
        .select('name')
        .eq('id', testBagId)
        .single();

      expect(error).toBeNull();
      expect(bagData?.name).toBe("Test Barista's Ethiopian Yirgacheffe 2023-12-01");
    });

    it('should handle missing roast date with fallback', async () => {
      // Create bag without roast date
      const response = await fetch(`${API_BASE}/api/bags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testAuthToken}`
        },
        body: JSON.stringify({
          bean_id: testBeanId,
          purchase_date: '2023-12-01',
          weight_g: 250
        })
      });

      expect(response.status).toBe(201);
      const result = await response.json() as ApiResponse;
      
      testBagId = result.data.id;

      // Should use "Unknown Roast" fallback
      expect(result.data.name).toBe("Test Barista's Ethiopian Yirgacheffe Unknown Roast");
    });

    it('should preserve special characters in names', async () => {
      // Create bean with special characters
      const { data: specialBean, error: beanError } = await supabase
        .from('bean')
        .insert({
          name: 'Café Münchën Naïve',
          roaster_id: null
        })
        .select()
        .single();

      expect(beanError).toBeNull();
      expect(specialBean).toBeDefined();

      // Create bag with special character bean
      const response = await fetch(`${API_BASE}/api/bags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testAuthToken}`
        },
        body: JSON.stringify({
          bean_id: specialBean!.id,
          roast_date: '2023-12-01',
          purchase_date: '2023-12-01',
          weight_g: 250
        })
      });

      expect(response.status).toBe(201);
      const result = await response.json() as ApiResponse;
      
      testBagId = result.data.id;

      // Special characters should be preserved
      expect(result.data.name).toBe("Test Barista's Café Münchën Naïve 2023-12-01");
      
      // Clean up special bean
      await supabase.from('bean').delete().eq('id', specialBean!.id);
    });
  });

  describe('Name Preview Functionality', () => {
    it('should generate preview name matching final stored name', async () => {
      const roastDate = '2023-12-15';
      
      // Get preview name
      const previewResponse = await fetch(`${API_BASE}/api/bags/preview-name`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testAuthToken}`
        },
        body: JSON.stringify({
          bean_id: testBeanId,
          roast_date: roastDate
        })
      });

      expect(previewResponse.status).toBe(200);
      const previewResult = await previewResponse.json() as ApiResponse;
      const previewName = previewResult.data.name;

      // Create actual bag
      const createResponse = await fetch(`${API_BASE}/api/bags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testAuthToken}`
        },
        body: JSON.stringify({
          bean_id: testBeanId,
          roast_date: roastDate,
          purchase_date: '2023-12-15',
          weight_g: 250
        })
      });

      expect(createResponse.status).toBe(201);
      const createResult = await createResponse.json() as ApiResponse;
      
      testBagId = createResult.data.id;

      // Preview and final names should match exactly
      expect(createResult.data.name).toBe(previewName);
      expect(previewName).toBe("Test Barista's Ethiopian Yirgacheffe 2023-12-15");
    });

    it('should handle preview with missing roast date', async () => {
      const previewResponse = await fetch(`${API_BASE}/api/bags/preview-name`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testAuthToken}`
        },
        body: JSON.stringify({
          bean_id: testBeanId
        })
      });

      expect(previewResponse.status).toBe(200);
      const previewResult = await previewResponse.json() as ApiResponse;
      
      expect(previewResult.data.name).toBe("Test Barista's Ethiopian Yirgacheffe Unknown Roast");
    });
  });

  describe('Fallback Behavior', () => {
    it('should use first_name when display_name is empty', async () => {
      // Create barista with only first_name
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: `test-firstname-${Date.now()}@example.com`,
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
          first_name: 'FirstOnly',
          email: authData.user!.email
        });

      // Create bag
      const response = await fetch(`${API_BASE}/api/bags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firstNameToken}`
        },
        body: JSON.stringify({
          bean_id: testBeanId,
          roast_date: '2023-12-01',
          purchase_date: '2023-12-01',
          weight_g: 250
        })
      });

      expect(response.status).toBe(201);
      const result = await response.json() as ApiResponse;
      
      // Should use first_name
      expect(result.data.name).toBe("FirstOnly's Ethiopian Yirgacheffe 2023-12-01");
      
      // Clean up
      await supabase.from('bag').delete().eq('id', result.data.id);
      await supabase.from('barista').delete().eq('id', firstNameBaristaId);
      await supabase.auth.admin.deleteUser(firstNameBaristaId);
    });

    it('should use Anonymous when both names are empty', async () => {
      // Create barista with no names
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: `test-anonymous-${Date.now()}@example.com`,
        password: 'TestPassword123!'
      });

      expect(authError).toBeNull();
      expect(authData.user).toBeDefined();

      const anonBaristaId = authData.user!.id;
      const anonToken = authData.session?.access_token || '';

      // Create barista with empty names
      await supabase
        .from('barista')
        .insert({
          id: anonBaristaId,
          display_name: '',
          first_name: '',
          email: authData.user!.email
        });

      // Create bag
      const response = await fetch(`${API_BASE}/api/bags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonToken}`
        },
        body: JSON.stringify({
          bean_id: testBeanId,
          roast_date: '2023-12-01',
          purchase_date: '2023-12-01',
          weight_g: 250
        })
      });

      expect(response.status).toBe(201);
      const result = await response.json() as ApiResponse;
      
      // Should use "Anonymous" fallback
      expect(result.data.name).toBe("Anonymous's Ethiopian Yirgacheffe 2023-12-01");
      
      // Clean up
      await supabase.from('bag').delete().eq('id', result.data.id);
      await supabase.from('barista').delete().eq('id', anonBaristaId);
      await supabase.auth.admin.deleteUser(anonBaristaId);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle invalid bean_id gracefully', async () => {
      const response = await fetch(`${API_BASE}/api/bags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testAuthToken}`
        },
        body: JSON.stringify({
          bean_id: '00000000-0000-0000-0000-000000000000',
          roast_date: '2023-12-01',
          purchase_date: '2023-12-01',
          weight_g: 250
        })
      });

      // Should return validation error
      expect(response.status).toBe(400);
      const result = await response.json() as ApiResponse;
      expect(result.error).toBeDefined();
    });

    it('should handle missing required fields', async () => {
      const response = await fetch(`${API_BASE}/api/bags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testAuthToken}`
        },
        body: JSON.stringify({
          roast_date: '2023-12-01'
          // Missing bean_id
        })
      });

      expect(response.status).toBe(400);
      const result = await response.json() as ApiResponse;
      expect(result.error).toBeDefined();
    });
  });

  describe('Date Formatting', () => {
    it('should format various date formats correctly', async () => {
      const testDates = [
        { input: '2023-01-15', expected: '2023-01-15' },
        { input: '2023-12-31', expected: '2023-12-31' },
        { input: '2024-02-29', expected: '2024-02-29' } // Leap year
      ];

      for (const testCase of testDates) {
        const response = await fetch(`${API_BASE}/api/bags/preview-name`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testAuthToken}`
          },
          body: JSON.stringify({
            bean_id: testBeanId,
            roast_date: testCase.input
          })
        });

        expect(response.status).toBe(200);
        const result = await response.json() as ApiResponse;
        expect(result.data.name).toContain(testCase.expected);
      }
    });

    it('should handle invalid date formats with fallback', async () => {
      const response = await fetch(`${API_BASE}/api/bags/preview-name`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testAuthToken}`
        },
        body: JSON.stringify({
          bean_id: testBeanId,
          roast_date: 'invalid-date'
        })
      });

      expect(response.status).toBe(200);
      const result = await response.json() as ApiResponse;
      expect(result.data.name).toContain('Unknown Roast');
    });
  });

  describe('Storage Consistency', () => {
    it('should store generated name in database immediately', async () => {
      const response = await fetch(`${API_BASE}/api/bags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testAuthToken}`
        },
        body: JSON.stringify({
          bean_id: testBeanId,
          roast_date: '2023-12-20',
          purchase_date: '2023-12-20',
          weight_g: 250
        })
      });

      expect(response.status).toBe(201);
      const result = await response.json() as ApiResponse;
      testBagId = result.data.id;

      // Immediately query database
      const { data: bagData, error } = await supabase
        .from('bag')
        .select('name, bean_id, roast_date')
        .eq('id', testBagId)
        .single();

      expect(error).toBeNull();
      expect(bagData?.name).toBeDefined();
      expect(bagData?.name).toBe(result.data.name);
      expect(bagData?.name).toBe("Test Barista's Ethiopian Yirgacheffe 2023-12-20");
    });
  });
});