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
const BATCH_SIZE = 100; // Insert in batches to avoid timeouts
const DELAY_BETWEEN_BATCHES = 100; // ms

async function bulkImportCities(citiesData) {
  console.log(`Starting bulk import of ${citiesData.length} cities...`);
  
  // Get state mapping
  const { data: states } = await supabase
    .from('states')
    .select('id, abbreviation');
  
  const stateMap = {};
  states?.forEach(state => {
    stateMap[state.abbreviation] = state.id;
  });
  
  console.log(`Found ${states?.length || 0} states`);
  
  // Prepare cities for insertion
  const citiesToInsert = citiesData
    .map(city => {
      const stateId = stateMap[city.state_abbr];
      if (!stateId) {
        console.warn(`State ${city.state_abbr} not found for city ${city.name}`);
        return null;
      }
      
      return {
        name: city.name,
        state_id: stateId,
        population: city.population || 0,
        stats: city.stats || {},
        created_at: new Date().toISOString()
      };
    })
    .filter(city => city !== null);
  
  console.log(`Prepared ${citiesToInsert.length} cities for insertion`);
  
  // Insert in batches
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  for (let i = 0; i < citiesToInsert.length; i += BATCH_SIZE) {
    const batch = citiesToInsert.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(citiesToInsert.length / BATCH_SIZE);
    
    console.log(`\nProcessing batch ${batchNum}/${totalBatches} (${batch.length} cities)...`);
    
    try {
      const { data, error } = await supabase
        .from('cities')
        .insert(batch)
        .select('id');
      
      if (error) {
        console.error(`❌ Batch ${batchNum} error:`, error.message);
        errorCount += batch.length;
        errors.push({ batch: batchNum, error: error.message, cities: batch.map(c => c.name) });
      } else {
        successCount += data.length;
        console.log(`✅ Batch ${batchNum}: Inserted ${data.length} cities`);
      }
    } catch (err) {
      console.error(`❌ Batch ${batchNum} exception:`, err.message);
      errorCount += batch.length;
      errors.push({ batch: batchNum, error: err.message, cities: batch.map(c => c.name) });
    }
    
    // Delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < citiesToInsert.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('Import Summary:');
  console.log(`✅ Successfully inserted: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📊 Total processed: ${citiesToInsert.length}`);
  
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => {
      console.log(`  Batch ${e.batch}: ${e.error}`);
      if (e.cities.length <= 5) {
        console.log(`    Cities: ${e.cities.join(', ')}`);
      }
    });
  }
}

// Main execution
const csvPath = process.argv[2] || 'cities.csv';

if (!fs.existsSync(csvPath)) {
  console.error(`File not found: ${csvPath}`);
  console.log('\nUsage: node scripts/bulk-import-cities.js <path-to-cities.csv>');
  console.log('\nCSV format should be:');
  console.log('  name,state_abbr,population,stats');
  console.log('  "New York","NY",8336817,"{}"');
  process.exit(1);
}

console.log(`Reading cities from: ${csvPath}`);

// Read and parse CSV
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n').filter(line => line.trim());
const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

console.log(`Found ${lines.length - 1} cities in CSV`);

const citiesData = lines.slice(1).map(line => {
  const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
  const city = {};
  headers.forEach((header, index) => {
    city[header] = values[index];
  });
  
  // Parse population as number
  if (city.population) {
    city.population = parseInt(city.population) || 0;
  }
  
  // Parse stats as JSON if provided
  if (city.stats) {
    try {
      city.stats = JSON.parse(city.stats);
    } catch {
      city.stats = {};
    }
  }
  
  return city;
});

bulkImportCities(citiesData).catch(console.error);



