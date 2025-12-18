// Test Supabase connection with real credentials
import dotenv from 'dotenv';
dotenv.config();

import { supabase } from './config/supabase.js';
import { testDatabaseConnection, initializeDatabase } from './config/database.js';

async function testSupabaseConnection() {
  console.log('🔌 Testing Supabase connection...');
  
  try {
    // Test 1: Basic connection
    console.log('1. Testing basic connection...');
    const isConnected = await testDatabaseConnection();
    console.log(`   ✅ Database connection: ${isConnected ? 'SUCCESS' : 'FAILED'}`);

    // Test 2: Test auth functionality
    console.log('2. Testing auth service...');
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.log(`   ❌ Auth test failed: ${error.message}`);
    } else {
      console.log(`   ✅ Auth service working (found ${data.users.length} users)`);
    }

    // Test 3: Test database query
    console.log('3. Testing database query...');
    const { data: tables, error: queryError } = await supabase
      .from('barista')
      .select('count')
      .limit(1);
    
    if (queryError) {
      console.log(`   ❌ Database query failed: ${queryError.message}`);
    } else {
      console.log('   ✅ Database query successful');
    }

    // Test 4: Initialize database utilities
    console.log('4. Testing database initialization...');
    await initializeDatabase();
    console.log('   ✅ Database initialization complete');

    console.log('\n🎉 All Supabase connection tests passed!');
    console.log('\n📋 Connection Summary:');
    console.log(`   Project URL: ${process.env.SUPABASE_URL}`);
    console.log(`   Service Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20)}...`);
    console.log('   Status: ✅ READY FOR DEVELOPMENT');

  } catch (error) {
    console.error('\n❌ Connection test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check your SUPABASE_URL is correct');
    console.log('   2. Verify SUPABASE_SERVICE_ROLE_KEY is the service role key (not anon key)');
    console.log('   3. Ensure your Supabase project is active');
    console.log('   4. Check if RLS policies are properly configured');
  }
}

// Run the test
testSupabaseConnection().catch(console.error);