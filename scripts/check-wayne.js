import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY
);

async function checkWayne() {
  console.log('Checking Wayne, NJ...\n');
  
  // Get NJ state
  const { data: nj, error: stateError } = await supabase
    .from('states')
    .select('id, abbreviation, name')
    .eq('abbreviation', 'NJ')
    .single();
  
  if (stateError || !nj) {
    console.error('Error finding NJ:', stateError);
    return;
  }
  
  console.log(`NJ State: ${nj.name} (ID: ${nj.id})\n`);
  
  // Check for Wayne in database
  const { data: wayneDB, error: dbError } = await supabase
    .from('cities')
    .select('*')
    .eq('name', 'Wayne')
    .eq('state_id', nj.id)
    .maybeSingle();
  
  console.log('Wayne in Database:', wayneDB ? '✅ EXISTS' : '❌ NOT FOUND');
  if (wayneDB) {
    console.log('Database entry:', JSON.stringify(wayneDB, null, 2));
  }
  
  // Check CSV
  console.log('\n--- Checking CSV ---');
  const csvPath = '/Users/bartstrellz/Downloads/Telegram Desktop/us-cities.csv';
  const csv = fs.readFileSync(csvPath, 'utf-8');
  const lines = csv.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  const wayneCSV = lines.slice(1).find(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const city = {};
    headers.forEach((h, idx) => city[h] = values[idx]);
    return city.name === 'Wayne' && city.state_code === 'NJ';
  });
  
  if (wayneCSV) {
    const values = wayneCSV.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const city = {};
    headers.forEach((h, idx) => city[h] = values[idx]);
    console.log('✅ Wayne found in CSV:');
    console.log(`   Name: ${city.name}`);
    console.log(`   State: ${city.state_code}`);
    console.log(`   County: ${city.county}`);
    console.log(`   Type: ${city.type}`);
    console.log(`   Population: ${city.population}`);
    console.log(`   ZIP: ${city.zip_codes}`);
    
    // Check why it might have been skipped
    console.log('\n--- Analysis ---');
    if (!wayneDB) {
      console.log('❌ Wayne is NOT in database but IS in CSV');
      console.log('   This means it should have been imported but was skipped.');
      console.log('\n   Possible reasons:');
      console.log('   1. Name matching issue (case sensitivity, spacing)');
      console.log('   2. Township naming - checking if "Wayne (Township)" exists...');
      
      const { data: wayneTownship } = await supabase
        .from('cities')
        .select('*')
        .eq('name', 'Wayne (Township)')
        .eq('state_id', nj.id)
        .maybeSingle();
      
      if (wayneTownship) {
        console.log('   ✅ Found "Wayne (Township)" in database!');
        console.log('   The script skipped it because it exists as "Wayne (Township)"');
      } else {
        console.log('   ❌ "Wayne (Township)" also not found');
        console.log('   This is a bug - Wayne should have been imported!');
      }
    } else {
      console.log('✅ Wayne exists in database - correctly skipped as duplicate');
    }
  } else {
    console.log('❌ Wayne NOT found in CSV');
  }
}

checkWayne().catch(console.error);



