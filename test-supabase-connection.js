import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseKey?.length || 0);
console.log('Key starts with:', supabaseKey?.substring(0, 10) || 'none');

if (!supabaseKey || supabaseKey === 'your_anon_key_here') {
  console.log('❌ Please set your actual Supabase anon key in .env file');
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
    
    // Test a real query
    const { data: cities, error: citiesError } = await supabase
      .from('cities')
      .select('name, states(abbreviation, name)')
      .limit(5);
    
    if (citiesError) {
      console.log('❌ Cities query error:', citiesError);
      return;
    }
    
    console.log('✅ Cities query successful!');
    console.log('Sample cities:', cities);
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
  }
}

testConnection();
