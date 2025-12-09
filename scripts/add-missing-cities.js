import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  'https://apsdwdudkqnfwdfcbfaz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwc2R3ZHVka3FuZndkZmNiZmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjE3OTEzNiwiZXhwIjoyMDY3NzU1MTM2fQ.pL1KpGNgmzd_Z2h3YmsqqW1-C8gruG08Ae3FgULgKK0'
);

// Read verified missing cities
const verified = JSON.parse(fs.readFileSync('missing-cities-verified.json', 'utf8'));
const missingCities = verified.notFoundInDb;

// Read CSV for population data
const csvPath = process.env.HOME + '/Downloads/Telegram Desktop/us-cities.csv';
const csvContent = fs.readFileSync(csvPath, 'utf8');
const lines = csvContent.split('\n').slice(1).filter(l => l.trim());

// Build CSV lookup for population
const csvLookup = {};
for (const line of lines) {
  const cols = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
  if (cols && cols.length >= 11) {
    const name = cols[1]?.replace(/"/g, '').trim();
    const stateCode = cols[3]?.replace(/"/g, '').trim();
    const lat = parseFloat(cols[6]) || 0;
    const lng = parseFloat(cols[7]) || 0;
    const population = parseInt(cols[10]) || 0;
    const key = `${name}|${stateCode}`;
    if (!csvLookup[key] || population > csvLookup[key].population) {
      csvLookup[key] = { name, stateCode, lat, lng, population };
    }
  }
}

async function addCities() {
  // Get states
  const { data: states } = await supabase.from('states').select('id, abbreviation, name');
  const stateMap = {};
  states.forEach(s => {
    stateMap[s.abbreviation] = { id: s.id, name: s.name };
  });

  console.log(`Adding ${missingCities.length} missing cities to database...\n`);

  const added = [];
  const failed = [];

  for (const city of missingCities) {
    const stateInfo = stateMap[city.state];
    if (!stateInfo) {
      failed.push({ city: city.name, state: city.state, reason: 'Unknown state' });
      continue;
    }

    // Get CSV data for this city
    const csvKey = `${city.name}|${city.state}`;
    const csvData = csvLookup[csvKey];

    // Create city record with only valid columns
    const cityRecord = {
      name: city.name,
      state_id: stateInfo.id,
      population: csvData?.population || 0,
      stats: {
        coordinates: {
          lat: csvData?.lat || 0,
          lng: csvData?.lng || 0
        },
        acp_providers: 0,
        avg_approval_rate: 85,
        lifeline_providers: 0,
        avg_processing_time: 5
      }
    };

    const { data, error } = await supabase
      .from('cities')
      .insert(cityRecord)
      .select();

    if (error) {
      failed.push({ city: city.name, state: city.state, reason: error.message });
      console.log(`❌ ${city.name}, ${city.state}: ${error.message}`);
    } else {
      added.push({ city: city.name, state: city.state, population: cityRecord.population });
      console.log(`✅ ${city.name}, ${city.state} (pop: ${cityRecord.population.toLocaleString()})`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Added: ${added.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log('\nFailed cities:');
    failed.forEach(f => console.log(`   ${f.city}, ${f.state}: ${f.reason}`));
  }

  // Get new total
  const { count } = await supabase.from('cities').select('*', { count: 'exact', head: true });
  console.log(`\n📊 New total cities in DB: ${count?.toLocaleString()}`);

  fs.writeFileSync('added-cities.json', JSON.stringify({ added, failed }, null, 2));
}

addCities();
