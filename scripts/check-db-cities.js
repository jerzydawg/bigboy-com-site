import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://apsdwdudkqnfwdfcbfaz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwc2R3ZHVka3FuZndkZmNiZmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjE3OTEzNiwiZXhwIjoyMDY3NzU1MTM2fQ.pL1KpGNgmzd_Z2h3YmsqqW1-C8gruG08Ae3FgULgKK0'
);

// Check for cities with apostrophes and special characters
const searchTerms = [
  "Bailey",
  "Cañon",
  "Canon",
  "Coeur",
  "L'Anse",
  "Lee's",
  "Lees",
  "D'Lo",
  "Morgan",
  "Sullivan"
];

async function checkCities() {
  console.log('Checking database for special character cities...\n');
  
  for (const term of searchTerms) {
    const { data, error } = await supabase
      .from('cities')
      .select('name, id')
      .ilike('name', `%${term}%`)
      .limit(10);
    
    if (data && data.length > 0) {
      console.log(`"${term}" found (${data.length}):`);
      data.forEach(c => console.log(`   - ${c.name}`));
    } else {
      console.log(`"${term}" - NOT FOUND`);
    }
    console.log('');
  }
}

checkCities();
