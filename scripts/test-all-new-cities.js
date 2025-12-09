import { createClient } from '@supabase/supabase-js';
import { createCitySlug, generateCityNameVariationsForLookup } from '../src/lib/slug-utils.js';
import fs from 'fs';

const supabase = createClient(
  'https://apsdwdudkqnfwdfcbfaz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwc2R3ZHVka3FuZndkZmNiZmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjE3OTEzNiwiZXhwIjoyMDY3NzU1MTM2fQ.pL1KpGNgmzd_Z2h3YmsqqW1-C8gruG08Ae3FgULgKK0'
);

// Read the cities we just added
const addedCities = JSON.parse(fs.readFileSync('added-cities.json', 'utf8'));

async function test() {
  const { data: states } = await supabase.from('states').select('id, abbreviation');
  const stateMap = {};
  const stateAbbrById = {};
  states.forEach(s => {
    stateMap[s.abbreviation] = s.id;
    stateAbbrById[s.id] = s.abbreviation;
  });
  
  console.log(`Testing slug lookup for all ${addedCities.added.length} newly added cities...\n`);
  
  let passed = 0;
  let failed = 0;
  const failures = [];
  
  for (const city of addedCities.added) {
    const slug = createCitySlug(city.city);
    const variations = generateCityNameVariationsForLookup(slug);
    const stateId = stateMap[city.state];
    
    let found = null;
    for (const variation of variations) {
      const { data } = await supabase
        .from('cities')
        .select('name')
        .eq('state_id', stateId)
        .ilike('name', variation)
        .limit(1);
      
      if (data && data.length > 0) {
        found = data[0].name;
        break;
      }
    }
    
    if (found) {
      passed++;
    } else {
      failed++;
      failures.push({
        city: city.city,
        state: city.state,
        slug,
        variations: variations.slice(0, 5)
      });
      console.log(`❌ ${city.city}, ${city.state} → /${city.state.toLowerCase()}/${slug}/`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  
  if (failures.length > 0) {
    console.log('\nFailed cities need slug fixes:');
    failures.forEach(f => {
      console.log(`\n${f.city}, ${f.state}`);
      console.log(`   Slug: ${f.slug}`);
      console.log(`   Tried: ${f.variations.join(', ')}`);
    });
  } else {
    console.log('\n✅ All newly added cities have working slug lookups!');
  }
}

test();
