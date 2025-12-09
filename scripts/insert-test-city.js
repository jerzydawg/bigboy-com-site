import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertTestCity() {
  console.log('Getting NJ state ID...');
  const { data: nj, error: stateError } = await supabase
    .from('states')
    .select('id, name, abbreviation')
    .eq('abbreviation', 'NJ')
    .single();

  if (stateError || !nj) {
    console.error('Error finding NJ:', stateError);
    return;
  }

  console.log(`Found: ${nj.name} (ID: ${nj.id})`);

  console.log('\nInserting test city "Test City"...');
  const { data, error } = await supabase
    .from('cities')
    .insert({
      name: 'Test City',
      state_id: nj.id,
      population: 5000,
      stats: null,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error inserting:', error.message);
    if (error.code === '42501') {
      console.log('\n💡 RLS is blocking. You need to either:');
      console.log('   1. Add service role key to .env, OR');
      console.log('   2. Run this SQL in Supabase SQL Editor:');
      console.log('      CREATE POLICY "Allow anon inserts" ON cities');
      console.log('      FOR INSERT TO anon WITH CHECK (true);');
    }
    return;
  }

  console.log('✅ Successfully inserted:');
  console.log(`   ID: ${data.id}`);
  console.log(`   Name: ${data.name}`);
  console.log(`   State: ${nj.abbreviation}`);
  console.log(`   Population: ${data.population}`);
  console.log(`\n   URL: https://government-phone.co/nj/test-city`);
}

insertTestCity();
