/**
 * Remove cities from Supabase that are not in us-cities.csv
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import readline from 'readline';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Read CSV and extract city+state combinations
function readCSVCities(filePath) {
  const csvContent = fs.readFileSync(filePath, 'utf-8');
  const lines = csvContent.split('\n');
  const cityStateSet = new Set(); // city+state combinations
  
  // Skip header (first line)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV - handle quoted fields properly
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Last value
    
    if (values.length < 4) continue;
    
    // Column 2 is city name (index 1), Column 4 is state code (index 3)
    let cityName = values[1].replace(/^"|"$/g, '').trim();
    let stateCode = values[3].replace(/^"|"$/g, '').trim();
    
    if (cityName && stateCode) {
      // Normalize: lowercase, remove extra spaces
      cityName = cityName.toLowerCase().replace(/\s+/g, ' ').trim();
      stateCode = stateCode.toLowerCase().trim();
      
      // Store as city|state combination
      cityStateSet.add(`${cityName}|${stateCode}`);
    }
  }
  
  return cityStateSet;
}

// Normalize city name for comparison
function normalizeCityName(name) {
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

async function removeCitiesNotInCSV() {
  const csvPath = '/Users/bartstrellz/Downloads/Telegram Desktop/us-cities.csv';
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    process.exit(1);
  }
  
  console.log('📖 Reading CSV file...');
  const csvCityStates = readCSVCities(csvPath);
  console.log(`✅ Found ${csvCityStates.size} city+state combinations in CSV`);
  
  console.log('\n🔍 Fetching all cities from Supabase...');
  
  // Fetch all cities with pagination (include state info)
  let allCities = [];
  let offset = 0;
  const BATCH_SIZE = 1000;
  let hasMore = true;
  
  // First, get all states for lookup
  const { data: states, error: statesError } = await supabase
    .from('states')
    .select('id, abbreviation');
  
  if (statesError) {
    console.error('❌ Error fetching states:', statesError);
    process.exit(1);
  }
  
  const stateMap = new Map();
  states.forEach(s => stateMap.set(s.id, s.abbreviation.toLowerCase()));
  
  while (hasMore) {
    const { data: cities, error } = await supabase
      .from('cities')
      .select('id, name, state_id')
      .order('name')
      .range(offset, offset + BATCH_SIZE - 1);
    
    if (error) {
      console.error('❌ Error fetching cities:', error);
      break;
    }
    
    if (cities && cities.length > 0) {
      allCities = allCities.concat(cities);
      console.log(`   Fetched ${cities.length} cities (Total: ${allCities.length})`);
      offset += BATCH_SIZE;
    } else {
      hasMore = false;
    }
    
    if (offset > 100000) break; // Safety limit
  }
  
  console.log(`\n✅ Found ${allCities.length} cities in Supabase`);
  
  // Find cities not in CSV (match on city+state)
  const citiesToRemove = [];
  
  console.log('\n🔍 Comparing cities (city+state combinations)...');
  for (const city of allCities) {
    const normalizedName = normalizeCityName(city.name);
    const stateAbbr = stateMap.get(city.state_id) || '';
    const key = `${normalizedName}|${stateAbbr}`;
    
    if (!csvCityStates.has(key)) {
      citiesToRemove.push(city);
    }
  }
  
  console.log(`\n⚠️  Found ${citiesToRemove.length} cities NOT in CSV`);
  console.log(`   These will be removed from Supabase`);
  
  if (citiesToRemove.length === 0) {
    console.log('\n✅ All cities are in CSV. Nothing to remove.');
    return;
  }
  
  // Show sample of cities to be removed
  console.log('\n📋 Sample cities to be removed (first 20):');
  citiesToRemove.slice(0, 20).forEach(city => {
    console.log(`   - ${city.name} (ID: ${city.id})`);
  });
  
  if (citiesToRemove.length > 20) {
    console.log(`   ... and ${citiesToRemove.length - 20} more`);
  }
  
  // Confirm deletion
  console.log(`\n⚠️  WARNING: This will delete ${citiesToRemove.length} cities from Supabase!`);
  console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Delete cities in batches
  console.log('\n🗑️  Deleting cities...');
  const deleteBatchSize = 100;
  let deleted = 0;
  
  for (let i = 0; i < citiesToRemove.length; i += deleteBatchSize) {
    const batch = citiesToRemove.slice(i, i + deleteBatchSize);
    const ids = batch.map(c => c.id);
    
    const { error } = await supabase
      .from('cities')
      .delete()
      .in('id', ids);
    
    if (error) {
      console.error(`❌ Error deleting batch:`, error);
    } else {
      deleted += batch.length;
      console.log(`   Deleted ${deleted}/${citiesToRemove.length} cities`);
    }
  }
  
  console.log(`\n✅ Successfully removed ${deleted} cities from Supabase`);
  console.log(`   Remaining cities: ${allCities.length - deleted}`);
}

removeCitiesNotInCSV()
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

