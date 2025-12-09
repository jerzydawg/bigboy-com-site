import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://amhtjazsxrbftufkhwhf.supabase.co';
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY || 'your_anon_key_here';

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseKey.length);
console.log('Key starts with:', supabaseKey.substring(0, 10));

if (supabaseKey === 'your_anon_key_here') {
  console.log('❌ Please set your actual Supabase anon key in .env file');
  console.log('Get it from: https://amhtjazsxrbftufkhwhf.supabase.co/project/settings/api');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test a simple query
    const { data, error } = await supabase
      .from('cities')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Database error:', error);
      return;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('Data:', data);
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
  }
}

testConnection();
