import { createClient } from '@supabase/supabase-js';
import { createCitySlug, generateCityNameVariationsForLookup } from '../src/lib/slug-utils.js';

const supabase = createClient(
  'https://apsdwdudkqnfwdfcbfaz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwc2R3ZHVka3FuZndkZmNiZmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjE3OTEzNiwiZXhwIjoyMDY3NzU1MTM2fQ.pL1KpGNgmzd_Z2h3YmsqqW1-C8gruG08Ae3FgULgKK0'
);

// Test cities with special characters
const testCities = [
  { name: "O'Fallon", state: 'MO' },
  { name: "Lee's Summit", state: 'MO' },
  { name: "Port St. Lucie", state: 'FL' },
  { name: "Port St. Joe", state: 'FL' },
  { name: "Sault Ste. Marie", state: 'MI' },
  { name: "César Chávez", state: 'TX' },
  { name: "Town 'n' Country", state: 'FL' },
  { name: "Land O' Lakes", state: 'FL' },
  { name: "Helena-West Helena", state: 'AR' },
  { name: "Parsippany-Troy Hills", state: 'NJ' },
  { name: "Bay St. Louis", state: 'MS' },
  { name: "Upper St. Clair", state: 'PA' },
  { name: "Mt. Bullion", state: 'CA' },
  { name: "Wright-Patterson AFB", state: 'OH' },
  { name: "E. Lopez", state: 'TX' },
];

async function test() {
  const { data: states } = await supabase.from('states').select('id, abbreviation');
  const stateMap = {};
  states.forEach(s => stateMap[s.abbreviation] = s.id);
  
  console.log('Testing slug → database lookup for special cities\n');
  console.log('='.repeat(80));
  
  let passed = 0;
  let failed = 0;
  
  for (const city of testCities) {
    // Generate slug from city name
    const slug = createCitySlug(city.name);
    
    // Generate variations to try
    const variations = generateCityNameVariationsForLookup(slug);
    
    // Try to find in database
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
      console.log(`✅ ${city.name}, ${city.state}`);
      console.log(`   Slug: /${city.state.toLowerCase()}/${slug}/`);
      console.log(`   Found in DB as: "${found}"`);
      passed++;
    } else {
      console.log(`❌ ${city.name}, ${city.state}`);
      console.log(`   Slug: /${city.state.toLowerCase()}/${slug}/`);
      console.log(`   Variations tried: ${variations.slice(0, 5).join(', ')}...`);
      failed++;
    }
    console.log('');
  }
  
  console.log('='.repeat(80));
  console.log(`\nResults: ${passed} passed, ${failed} failed`);
}

test();
