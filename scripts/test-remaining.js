import { createClient } from '@supabase/supabase-js';
import { createCitySlug, generateCityNameVariationsForLookup } from '../src/lib/slug-utils.js';
import fs from 'fs';

const supabase = createClient(
  'https://apsdwdudkqnfwdfcbfaz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwc2R3ZHVka3FuZndkZmNiZmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjE3OTEzNiwiZXhwIjoyMDY3NzU1MTM2fQ.pL1KpGNgmzd_Z2h3YmsqqW1-C8gruG08Ae3FgULgKK0'
);

// Cities with complex names that still need testing
const testCities = [
  { name: "Shorewood-Tower Hills-Harbert", state: "MI" },
  { name: "Encantada-Ranchito-El Calaboz", state: "TX" },
  { name: "Qui-nai-elt Village", state: "WA" },
  { name: "Fontana-on-Geneva Lake", state: "WI" },
  { name: "Fredonia (Biscoe)", state: "AR" },
  { name: "Village of Oak Creek (Big Park)", state: "AZ" },
  { name: "El Paso de Robles (Paso Robles)", state: "CA" },
  { name: "San Buenaventura (Ventura)", state: "CA" },
  { name: "Raymer (New Raymer)", state: "CO" },
  { name: "Alvan (Alvin)", state: "IL" },
  { name: "East St. Louis (Township)", state: "IL" },
  { name: "Ste. Marie (Township)", state: "IL" },
  { name: "Canton City (Hensel)", state: "ND" },
  { name: "Howard City (Boelus)", state: "NE" },
  { name: "Gann (Brinkhaven)", state: "OH" },
  { name: "Matamoras (New Matamoras)", state: "OH" },
  { name: "Tharptown (Uniontown)", state: "PA" },
  { name: "Addison (Webster Springs)", state: "WV" },
  { name: "Bath (Berkeley Springs)", state: "WV" },
  { name: "Womelsdorf (Coalton)", state: "WV" },
];

async function test() {
  const { data: states } = await supabase.from('states').select('id, abbreviation');
  const stateMap = {};
  states.forEach(s => stateMap[s.abbreviation] = s.id);
  
  console.log('Testing remaining complex city names...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const city of testCities) {
    const slug = createCitySlug(city.name);
    const variations = generateCityNameVariationsForLookup(slug);
    const stateId = stateMap[city.state];
    
    let found = null;
    for (const v of variations) {
      const { data } = await supabase.from('cities').select('name').eq('state_id', stateId).ilike('name', v).limit(1);
      if (data && data.length > 0) { found = data[0].name; break; }
    }
    
    if (found) {
      console.log(`✅ ${city.name} → /${city.state.toLowerCase()}/${slug}/`);
      passed++;
    } else {
      console.log(`❌ ${city.name} → /${city.state.toLowerCase()}/${slug}/`);
      console.log(`   Tried: ${variations.slice(0,3).join(', ')}`);
      failed++;
    }
  }
  
  console.log(`\nResults: ${passed} passed, ${failed} failed`);
}

test();
