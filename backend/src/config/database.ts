import { supabase } from './supabase.js';

/**
 * Database utility functions for RLS policy enforcement and connection management
 */

/**
 * Test database connection and RLS policies
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('barista')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Database connection test failed:', error.message);
      return false;
    }

    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection test error:', error);
    return false;
  }
}

/**
 * Verify RLS policies are enabled on critical tables
 */
export async function verifyRLSPolicies(): Promise<void> {
  const criticalTables = ['brew', 'bag', 'barista'];
  
  for (const table of criticalTables) {
    try {
      // Attempt to query without proper context - should be restricted by RLS
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      // Note: This test is limited since we're using service role key
      // In production, RLS policies would be tested with user tokens
      console.log(`RLS check for ${table}: ${error ? 'Protected' : 'Accessible'}`);
    } catch (error) {
      console.warn(`RLS verification failed for ${table}:`, error);
    }
  }
}

/**
 * Initialize database connection and verify setup
 */
export async function initializeDatabase(): Promise<void> {
  console.log('Initializing database connection...');
  
  const isConnected = await testDatabaseConnection();
  if (!isConnected) {
    throw new Error('Failed to connect to database');
  }

  await verifyRLSPolicies();
  console.log('Database initialization complete');
}

/**
 * Execute a query with proper error handling and logging
 */
export async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  operation: string
): Promise<T> {
  try {
    const { data, error } = await queryFn();
    
    if (error) {
      console.error(`Database error in ${operation}:`, error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
    
    if (data === null) {
      throw new Error(`No data returned from ${operation}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Query execution failed for ${operation}:`, error);
    throw error;
  }
}

/**
 * Batch operation helper with transaction-like behavior
 * Note: Supabase doesn't support true transactions via the client,
 * but we can implement basic rollback logic for critical operations
 */
export async function executeBatch<T>(
  operations: Array<() => Promise<T>>,
  rollbackFn?: () => Promise<void>
): Promise<T[]> {
  const results: T[] = [];
  
  try {
    for (const operation of operations) {
      const result = await operation();
      results.push(result);
    }
    
    return results;
  } catch (error) {
    console.error('Batch operation failed:', error);
    
    if (rollbackFn) {
      try {
        await rollbackFn();
        console.log('Rollback completed');
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
    }
    
    throw error;
  }
}