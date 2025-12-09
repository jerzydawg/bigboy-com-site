/**
 * Sync Supabase cities with CSV
 * - Remove cities not in CSV
 * - Add cities from CSV that are missing in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse CSV line handling quoted fields
function parseCSVLine(line) {
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
  values.push(current.trim());
  return values;
}

// Read all cities from CSV
function readCSVCities(filePath) {
  const csvContent = fs.readFileSync(filePath, 'utf-8');
  const lines = csvContent.split('\n');
  const cities = [];
  
  // Parse header
  const header = parseCSVLine(lines[0]);
  console.log('CSV Headers:', header.slice(0, 6).join(', '));
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    if (values.length < 5) continue;
    
    // CSV columns: id, name, county, state_code, state, zip_codes, type, latitude, longitude, area_code, population, ...
    const city = {
      csvId: parseInt(values[0]) || i,
      name: values[1].replace(/^"|"$/g, '').trim(),
      county: values[2].replace(/^"|"$/g, '').trim(),
      stateCode: values[3].replace(/^"|"$/g, '').trim().toUpperCase(),
      stateName: values[4].replace(/^"|"$/g, '').trim(),
      zipCodes: values[5] ? values[5].replace(/^"|"$/g, '').trim() : '',
      type: values[6] ? values[6].replace(/^"|"$/g, '').trim() : '',
      latitude: parseFloat(values[7]) || null,
      longitude: parseFloat(values[8]) || null,
      areaCode: values[9] ? values[9].replace(/^"|"$/g, '').trim() : '',
      population: parseInt(values[10]) || null,
    };
    
    if (city.name && city.stateCode) {
      cities.push(city);
    }
  }
  
  return cities;
}

// Normalize for comparison
function normalizeKey(name, stateCode) {
  return `${name.toLowerCase().replace(/\s+/g, ' ').trim()}|${stateCode.toLowerCase()}`;
}

async function syncCitiesWithCSV() {
  const csvPath = '/Users/bartstrellz/Downloads/Telegram Desktop/us-cities.csv';
  
  console.log('📖 Reading CSV file...');
  const csvCities = readCSVCities(csvPath);
  console.log(`✅ Found ${csvCities.length} cities in CSV\n`);
  
  // Create lookup map
  const csvCityMap = new Map();
  csvCities.forEach(city => {
    const key = normalizeKey(city.name, city.stateCode);
    if (!csvCityMap.has(key)) {
      csvCityMap.set(key, city);
    }
  });
  console.log(`   Unique city+state combinations: ${csvCityMap.size}`);
  
  // Fetch all states for lookup
  console.log('\n🔍 Fetching states from Supabase...');
  const { data: states, error: statesError } = await supabase
    .from('states')
    .select('id, abbreviation, name');
  
  if (statesError) {
    console.error('❌ Error fetching states:', statesError);
    process.exit(1);
  }
  
  const stateIdMap = new Map(); // abbreviation -> id
  const stateAbbrMap = new Map(); // id -> abbreviation
  states.forEach(s => {
    stateIdMap.set(s.abbreviation.toUpperCase(), s.id);
    stateAbbrMap.set(s.id, s.abbreviation.toUpperCase());
  });
  console.log(`✅ Found ${states.length} states`);
  
  // Fetch all cities from Supabase
  console.log('\n🔍 Fetching cities from Supabase...');
  let allDbCities = [];
  let offset = 0;
  const BATCH_SIZE = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data: cities, error } = await supabase
      .from('cities')
      .select('id, name, state_id')
      .order('id')
      .range(offset, offset + BATCH_SIZE - 1);
    
    if (error) {
      console.error('❌ Error:', error);
      break;
    }
    
    if (cities && cities.length > 0) {
      allDbCities = allDbCities.concat(cities);
      offset += BATCH_SIZE;
      process.stdout.write(`\r   Fetched ${allDbCities.length} cities...`);
    } else {
      hasMore = false;
    }
    
    if (offset > 100000) break;
  }
  console.log(`\n✅ Found ${allDbCities.length} cities in Supabase\n`);
  
  // Create lookup for existing cities
  const dbCityMap = new Map();
  allDbCities.forEach(city => {
    const stateAbbr = stateAbbrMap.get(city.state_id) || '';
    const key = normalizeKey(city.name, stateAbbr);
    dbCityMap.set(key, city);
  });
  
  // Find cities to remove (in DB but not in CSV)
  const citiesToRemove = [];
  allDbCities.forEach(city => {
    const stateAbbr = stateAbbrMap.get(city.state_id) || '';
    const key = normalizeKey(city.name, stateAbbr);
    if (!csvCityMap.has(key)) {
      citiesToRemove.push(city);
    }
  });
  
  // Find cities to add (in CSV but not in DB)
  const citiesToAdd = [];
  csvCityMap.forEach((city, key) => {
    if (!dbCityMap.has(key)) {
      const stateId = stateIdMap.get(city.stateCode);
      if (stateId) {
        citiesToAdd.push({
          name: city.name,
          state_id: stateId,
          population: city.population,
          stats: JSON.stringify({
            population: city.population,
            county: city.county,
            type: city.type,
            zip_codes: city.zipCodes,
            latitude: city.latitude,
            longitude: city.longitude,
            area_code: city.areaCode
          })
        });
      }
    }
  });
  
  console.log('📊 SYNC SUMMARY:');
  console.log('═'.repeat(60));
  console.log(`Cities in CSV: ${csvCities.length}`);
  console.log(`Unique city+state in CSV: ${csvCityMap.size}`);
  console.log(`Cities in Supabase: ${allDbCities.length}`);
  console.log(`Cities to REMOVE (not in CSV): ${citiesToRemove.length}`);
  console.log(`Cities to ADD (missing from DB): ${citiesToAdd.length}`);
  console.log(`Expected final count: ${allDbCities.length - citiesToRemove.length + citiesToAdd.length}`);
  console.log('═'.repeat(60));
  
  if (citiesToRemove.length > 0) {
    console.log('\n📋 Sample cities to REMOVE (first 10):');
    citiesToRemove.slice(0, 10).forEach(c => {
      const stateAbbr = stateAbbrMap.get(c.state_id) || '??';
      console.log(`   - ${c.name}, ${stateAbbr} (ID: ${c.id})`);
    });
  }
  
  if (citiesToAdd.length > 0) {
    console.log('\n📋 Sample cities to ADD (first 10):');
    citiesToAdd.slice(0, 10).forEach(c => {
      const stateAbbr = states.find(s => s.id === c.state_id)?.abbreviation || '??';
      console.log(`   - ${c.name}, ${stateAbbr}`);
    });
  }
  
  console.log('\n⚠️  Proceeding with sync in 5 seconds... (Ctrl+C to cancel)');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // REMOVE cities not in CSV
  if (citiesToRemove.length > 0) {
    console.log('\n🗑️  Removing cities not in CSV...');
    const removeBatchSize = 100;
    let removed = 0;
    
    for (let i = 0; i < citiesToRemove.length; i += removeBatchSize) {
      const batch = citiesToRemove.slice(i, i + removeBatchSize);
      const ids = batch.map(c => c.id);
      
      const { error } = await supabase
        .from('cities')
        .delete()
        .in('id', ids);
      
      if (error) {
        console.error(`❌ Error removing batch:`, error);
      } else {
        removed += batch.length;
        process.stdout.write(`\r   Removed ${removed}/${citiesToRemove.length} cities`);
      }
    }
    console.log(`\n✅ Removed ${removed} cities`);
  }
  
  // ADD cities from CSV
  if (citiesToAdd.length > 0) {
    console.log('\n➕ Adding cities from CSV...');
    const addBatchSize = 100;
    let added = 0;
    
    for (let i = 0; i < citiesToAdd.length; i += addBatchSize) {
      const batch = citiesToAdd.slice(i, i + addBatchSize);
      
      const { error } = await supabase
        .from('cities')
        .insert(batch);
      
      if (error) {
        console.error(`❌ Error adding batch:`, error.message);
      } else {
        added += batch.length;
        process.stdout.write(`\r   Added ${added}/${citiesToAdd.length} cities`);
      }
    }
    console.log(`\n✅ Added ${added} cities`);
  }
  
  // Verify final count
  const { count } = await supabase
    .from('cities')
    .select('id', { count: 'exact', head: true });
  
  console.log(`\n📊 FINAL COUNT: ${count} cities in Supabase`);
}

syncCitiesWithCSV()
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });


