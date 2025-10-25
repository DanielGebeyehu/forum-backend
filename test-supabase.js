// Test script to verify Supabase connection
require('dotenv').config();
const dbconnection = require('./Database/databaseconfig');

async function testSupabase() {
  try {
    console.log('🧪 Testing Supabase connection...');
    
    // Test connection
    const result = await dbconnection.query('SELECT NOW()');
    console.log('✅ Connection successful:', result.rows[0]);
    
    // Test if we can access the supabase client
    console.log('✅ Supabase client available:', !!dbconnection.supabase);
    
    console.log('🎉 Supabase setup is working correctly!');
  } catch (error) {
    console.error('❌ Supabase test failed:', error.message);
    console.log('\n📝 Make sure you have set up your environment variables:');
    console.log('- SUPABASE_URL');
    console.log('- SUPABASE_ANON_KEY');
  }
}

testSupabase();
