// Test environment variables loading
import dotenv from 'dotenv';

console.log('🔍 Testing environment variable loading...');

// Load .env file
const result = dotenv.config();
console.log('dotenv.config() result:', result);

console.log('\n📋 Environment Variables:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 
  `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

// Test if we can create Supabase client
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('\n✅ Environment variables loaded successfully!');
  
  // Try importing supabase config
  try {
    const { supabase } = await import('./config/supabase.js');
    console.log('✅ Supabase client created successfully!');
    
    // Test a simple query
    const { data, error } = await supabase
      .from('barista')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Database query failed:', error.message);
    } else {
      console.log('✅ Database connection successful!');
    }
    
  } catch (error) {
    console.log('❌ Failed to create Supabase client:', error);
  }
} else {
  console.log('\n❌ Environment variables not loaded properly');
}