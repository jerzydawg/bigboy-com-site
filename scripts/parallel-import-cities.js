import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const PARALLEL_WORKERS = 100;
const BATCH_SIZE_PER_WORKER = 10; // Each worker processes batches of 10 cities
const CSV_PATH = '/Users/bartstrellz/Downloads/Telegram Desktop/us-cities.csv';

// Progress tracking
let totalProcessed = 0;
let successCount = 0;
let errorCount = 0;
let skippedCount = 0;
const errors = [];
const startTime = Date.now();

// Thread-safe progress updater
function updateProgress(increment = 1, success = false, error = false, skipped = false) {
  totalProcessed += increment;
  if (success) successCount += increment;
  if (error) errorCount += increment;
  if (skipped) skippedCount += increment;
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const rate = (totalProcessed / elapsed).toFixed(0);
  process.stdout.write(
    `\r⏳ Progress: ${totalProcessed.toLocaleString()} | ✅ ${successCount.toLocaleString()} | ❌ ${errorCount.toLocaleString()} | ⏭️  ${skippedCount.toLocaleString()} | ${rate}/sec`
  );
}

async function loadAllData() {
  console.log('📊 Loading data...\n');
  
  // Step 1: Load CSV
  console.log('1️⃣  Loading CSV file...');
  const csv = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = csv.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  const allCitiesCSV = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const city = {};
    headers.forEach((h, idx) => city[h] = values[idx]);
    return city;
  });
  
  console.log(`   ✅ Loaded ${allCitiesCSV.length.toLocaleString()} cities from CSV\n`);
  
  // Step 2: Load states
  console.log('2️⃣  Loading states from database...');
  const { data: states, error: stateError } = await supabase
    .from('states')
    .select('id, abbreviation');
  
  if (stateError) {
    console.error('❌ Error loading states:', stateError);
    process.exit(1);
  }
  
  const stateMap = new Map();
  states?.forEach(s => {
    stateMap.set(s.abbreviation, s.id);
  });
  
  console.log(`   ✅ Found ${states?.length || 0} states\n`);
  
  // Step 3: Load all existing cities (optimized bulk query)
  console.log('3️⃣  Loading existing cities from database...');
  let allCitiesDB = [];
  let offset = 0;
  const limit = 5000; // Larger batches for faster loading
  let hasMore = true;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('cities')
      .select('id, name, state_id')
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('❌ Error loading cities:', error);
      break;
    }
    
    if (data && data.length > 0) {
      allCitiesDB = allCitiesDB.concat(data);
      offset += limit;
      process.stdout.write(`\r   Loading... ${allCitiesDB.length.toLocaleString()} cities`);
      hasMore = data.length === limit;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`\n   ✅ Loaded ${allCitiesDB.length.toLocaleString()} cities from database\n`);
  
  // Create lookup map: state_id -> Set of city names (case-sensitive)
  const dbCityMap = new Map();
  allCitiesDB.forEach(city => {
    const stateId = city.state_id;
    if (!dbCityMap.has(stateId)) {
      dbCityMap.set(stateId, new Set());
    }
    dbCityMap.get(stateId).add(city.name.trim());
  });
  
  // Step 4: Find missing cities
  console.log('4️⃣  Comparing CSV vs Database...');
  const missingCities = [];
  
  for (const city of allCitiesCSV) {
    const stateId = stateMap.get(city.state_code);
    if (!stateId) continue; // Skip if state not found
    
    const cityName = city.name.trim();
    const stateCities = dbCityMap.get(stateId);
    
    // Check if city exists (case-sensitive)
    if (!stateCities || !stateCities.has(cityName)) {
      // Check for Township variations
      let found = false;
      if (city.type === 'Township' && !cityName.includes('(Township)')) {
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
  
  console.log(`   ✅ Found ${missingCities.length.toLocaleString()} missing cities\n`);
  
  // Deduplicate
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
  
  console.log(`   ✅ After deduplication: ${citiesToInsert.length.toLocaleString()} cities to import\n`);
  
  return citiesToInsert;
}

// Worker function to process a batch of cities
async function processBatch(cities, workerId) {
  const results = { success: 0, error: 0, skipped: 0 };
  const batchErrors = [];
  
  for (const city of cities) {
    try {
      const { data, error } = await supabase
        .from('cities')
        .insert(city)
        .select('id')
        .maybeSingle();
      
      if (error) {
        // Check if it's a duplicate (race condition or already exists)
        if (error.code === '23505' || error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
          results.skipped++;
          updateProgress(1, false, false, true);
        } else {
          results.error++;
          updateProgress(1, false, true, false);
          batchErrors.push({ city: `${city.name}, ${city.state_id}`, error: error.message });
        }
      } else if (data) {
        results.success++;
        updateProgress(1, true, false, false);
      }
    } catch (err) {
      results.error++;
      updateProgress(1, false, true, false);
      batchErrors.push({ city: `${city.name}, ${city.state_id}`, error: err.message });
    }
  }
  
  return { results, errors: batchErrors };
}

// Parallel queue system with worker pool
async function parallelImport(citiesToInsert) {
  if (citiesToInsert.length === 0) {
    console.log('✅ No cities to import!');
    return;
  }
  
  console.log(`\n🚀 Starting parallel import with ${PARALLEL_WORKERS} workers...\n`);
  console.log(`   Batch size per worker: ${BATCH_SIZE_PER_WORKER} cities\n`);
  
  // Split cities into chunks
  const chunks = [];
  for (let i = 0; i < citiesToInsert.length; i += BATCH_SIZE_PER_WORKER) {
    chunks.push(citiesToInsert.slice(i, i + BATCH_SIZE_PER_WORKER));
  }
  
  console.log(`   Total batches: ${chunks.length.toLocaleString()}\n`);
  
  // Create a queue
  const queue = [...chunks];
  let queueIndex = 0;
  
  // Worker pool: maintain exactly PARALLEL_WORKERS active workers
  const workers = [];
  let activeWorkers = 0;
  
  return new Promise((resolve) => {
    function startWorker() {
      if (queueIndex >= queue.length) {
        activeWorkers--;
        if (activeWorkers === 0) {
          console.log('\n\n' + '='.repeat(70));
          resolve();
        }
        return;
      }
      
      const chunk = queue[queueIndex++];
      const workerId = queueIndex;
      
      processBatch(chunk, workerId)
        .then((result) => {
          if (result.errors && result.errors.length > 0) {
            errors.push(...result.errors);
          }
          // Start next worker immediately
          startWorker();
        })
        .catch((err) => {
          errors.push({ error: err.message || 'Unknown error' });
          updateProgress(chunk.length, false, true, false);
          // Start next worker even on error
          startWorker();
        });
    }
    
    // Start initial worker pool
    for (let i = 0; i < PARALLEL_WORKERS && i < queue.length; i++) {
      activeWorkers++;
      startWorker();
    }
  });
}

async function main() {
  try {
    const citiesToInsert = await loadAllData();
    
    // Show breakdown
    if (citiesToInsert.length > 0) {
      console.log('📊 Sample cities to import (first 20):');
      citiesToInsert.slice(0, 20).forEach((city, idx) => {
        console.log(`   ${idx + 1}. ${city.name} (State ID: ${city.state_id}, Pop: ${city.population.toLocaleString()})`);
      });
      if (citiesToInsert.length > 20) {
        console.log(`   ... and ${(citiesToInsert.length - 20).toLocaleString()} more\n`);
      } else {
        console.log('');
      }
    }
    
    await parallelImport(citiesToInsert);
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('📈 IMPORT SUMMARY:');
    console.log(`   ✅ Successfully inserted: ${successCount.toLocaleString()}`);
    console.log(`   ❌ Failed: ${errorCount.toLocaleString()}`);
    console.log(`   ⏭️  Skipped (duplicates): ${skippedCount.toLocaleString()}`);
    console.log(`   📊 Total processed: ${totalProcessed.toLocaleString()}`);
    console.log(`   ⏱️  Time elapsed: ${elapsed}s`);
    console.log(`   🚀 Average rate: ${(totalProcessed / elapsed).toFixed(0)} cities/sec`);
    
    if (errors.length > 0) {
      console.log(`\n⚠️  Errors encountered: ${errors.length}`);
      if (errors.length <= 20) {
        console.log('\n   Sample errors:');
        errors.slice(0, 10).forEach(e => {
          console.log(`      - ${e.city || 'Unknown'}: ${e.error}`);
        });
      }
    }
    
    console.log('\n✅ Import complete!\n');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();

