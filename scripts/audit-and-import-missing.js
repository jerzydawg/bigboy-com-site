import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const BATCH_SIZE = 100;
const DELAY_BETWEEN_BATCHES = 100;

async function auditAndImport() {
  console.log('=== COMPLETE AUDIT & IMPORT ===\n');
  
  // Step 1: Load CSV
  console.log('1. Loading CSV...');
  const csvPath = '/Users/bartstrellz/Downloads/Telegram Desktop/us-cities.csv';
  const csv = fs.readFileSync(csvPath, 'utf-8');
  const lines = csv.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  const allCitiesCSV = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const city = {};
    headers.forEach((h, idx) => city[h] = values[idx]);
    return city;
  });
  
  console.log(`   Loaded ${allCitiesCSV.length} cities from CSV\n`);
  
  // Step 2: Get all states
  console.log('2. Loading states from Supabase...');
  const { data: states } = await supabase.from('states').select('id, abbreviation');
  const stateMap = {};
  states?.forEach(s => {
    stateMap[s.abbreviation] = s.id;
  });
  console.log(`   Found ${states?.length || 0} states\n`);
  
  // Step 3: Get ALL cities from Supabase in bulk (much faster)
  console.log('3. Loading all cities from Supabase...');
  let allCitiesDB = [];
  let offset = 0;
  const limit = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('cities')
      .select('id, name, state_id')
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error loading cities:', error);
      break;
    }
    
    if (data && data.length > 0) {
      allCitiesDB = allCitiesDB.concat(data);
      offset += limit;
      process.stdout.write(`\r   Loaded ${allCitiesDB.length} cities...`);
      hasMore = data.length === limit;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`\n   Total loaded: ${allCitiesDB.length} cities from database\n`);
  
  // Create lookup map: state_id -> Set of city names (case-sensitive to match DB constraint)
  const dbCityMap = new Map();
  allCitiesDB.forEach(city => {
    const stateId = city.state_id;
    if (!dbCityMap.has(stateId)) {
      dbCityMap.set(stateId, new Set());
    }
    // Use exact name (case-sensitive) to match database unique constraint
    const exactName = city.name.trim();
    dbCityMap.get(stateId).add(exactName);
  });
  
  // Step 4: Find missing cities
  console.log('4. Comparing CSV vs Database...');
  const missingCities = [];
  
  for (const city of allCitiesCSV) {
    const stateId = stateMap[city.state_code];
    if (!stateId) continue; // Skip if state not found
    
    const cityName = city.name.trim();
    
    // Check if city exists in database (case-sensitive match)
    const stateCities = dbCityMap.get(stateId);
    if (!stateCities || !stateCities.has(cityName)) {
      // Also check variations for Township cities
      let found = false;
      if (city.type === 'Township' && !cityName.includes('(Township)')) {
        // Check if it exists as "CityName (Township)"
        const townshipName = `${cityName} (Township)`.trim();
        if (stateCities && stateCities.has(townshipName)) {
          found = true;
        }
      }
      
      if (!found) {
        missingCities.push({
          name: cityName,
          state_code: city.state_code,
          state_id: stateId,
          population: parseInt(city.population) || 0,
          type: city.type,
          stats: {
            county: city.county,
            zip_codes: city.zip_codes,
            latitude: parseFloat(city.latitude) || null,
            longitude: parseFloat(city.longitude) || null,
            area_code: city.area_code,
            households: parseInt(city.households) || null,
            median_income: parseInt(city.median_income) || null,
            land_area: parseFloat(city.land_area) || null,
            water_area: parseFloat(city.water_area) || null,
            time_zone: city.time_zone
          }
        });
      }
    }
  }
  
  console.log(`   Found ${missingCities.length} missing cities\n`);
  
  // Step 5: Show breakdown
  console.log('5. Missing Cities Breakdown:');
  const byState = {};
  const byType = {};
  missingCities.forEach(city => {
    byState[city.state_code] = (byState[city.state_code] || 0) + 1;
    byType[city.type] = (byType[city.type] || 0) + 1;
  });
  
  console.log('   By State (top 10):');
  Object.entries(byState)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([state, count]) => {
      console.log(`      ${state}: ${count}`);
    });
  
  console.log('\n   By Type:');
  Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`      ${type}: ${count}`);
    });
  
  console.log('\n   Sample missing cities (first 20):');
  missingCities.slice(0, 20).forEach(c => {
    console.log(`      - ${c.name}, ${c.state_code} (pop: ${c.population}, type: ${c.type})`);
  });
  
  // Step 6: Import missing cities
  if (missingCities.length === 0) {
    console.log('\n✅ No missing cities to import!');
    return;
  }
  
  console.log(`\n6. Importing ${missingCities.length} missing cities...`);
  
  // Prepare cities for insertion and deduplicate by (name, state_id)
  const seen = new Set();
  const citiesToInsert = [];
  
  for (const city of missingCities) {
    const key = `${city.name.trim()}|${city.state_id}`;
    if (!seen.has(key)) {
      seen.add(key);
      citiesToInsert.push({
        name: city.name.trim(),
        state_id: city.state_id,
        population: city.population,
        stats: city.stats,
        created_at: new Date().toISOString()
      });
    }
  }
  
  console.log(`   After deduplication: ${citiesToInsert.length} cities to insert\n`);
  
  // Insert in batches
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  for (let i = 0; i < citiesToInsert.length; i += BATCH_SIZE) {
    const batch = citiesToInsert.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(citiesToInsert.length / BATCH_SIZE);
    
    process.stdout.write(`\r   Processing batch ${batchNum}/${totalBatches} (${successCount} inserted, ${errorCount} errors)...`);
    
    try {
      // Insert one by one to handle conflicts gracefully
      for (const city of batch) {
        const { data, error } = await supabase
          .from('cities')
          .insert(city)
          .select('id')
          .maybeSingle();
        
        if (error) {
          // Check if it's a duplicate key error (city already exists)
          if (error.code === '23505' || error.message.includes('duplicate key')) {
            // City already exists, skip it
            continue;
          } else {
            console.error(`\n   ❌ Error inserting ${city.name}, ${city.state_id}:`, error.message);
            errorCount++;
            errors.push({ city: `${city.name}, ${city.state_id}`, error: error.message });
          }
        } else if (data) {
          successCount++;
        }
      }
    } catch (err) {
      console.error(`\n   ❌ Batch ${batchNum} exception:`, err.message);
      errorCount += batch.length;
      errors.push({ batch: batchNum, error: err.message, count: batch.length });
    }
    
    // Delay between batches
    if (i + BATCH_SIZE < citiesToInsert.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
  
  console.log('\n\n' + '='.repeat(50));
  console.log('IMPORT SUMMARY:');
  console.log(`✅ Successfully inserted: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📊 Total processed: ${citiesToInsert.length}`);
  
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.slice(0, 10).forEach(e => {
      console.log(`  Batch ${e.batch}: ${e.error}`);
    });
  }
  
  console.log('\n✅ Audit and import complete!');
}

auditAndImport().catch(console.error);

