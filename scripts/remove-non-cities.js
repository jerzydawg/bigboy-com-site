import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://apsdwdudkqnfwdfcbfaz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwc2R3ZHVka3FuZndkZmNiZmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjE3OTEzNiwiZXhwIjoyMDY3NzU1MTM2fQ.pL1KpGNgmzd_Z2h3YmsqqW1-C8gruG08Ae3FgULgKK0'
);

// Non-city entries to remove (universities, campuses, etc.)
const nonCities = [
  "The University of Virginia's College at Wise",
  "University of California-Davis",
  "University of California-Merced", 
  "University of California-Santa Barbara",
  "Rutgers University-Busch Campus",
  "Rutgers University-Livingston Campus",
  "Penn State Erie (Behrend)"
];

async function remove() {
  console.log('Removing non-city entries...\n');
  
  for (const name of nonCities) {
    const { data, error } = await supabase
      .from('cities')
      .delete()
      .ilike('name', name)
      .select();
    
    if (error) {
      console.log(`❌ Error removing "${name}": ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(`✅ Removed: ${name}`);
    } else {
      console.log(`⚠️ Not found: ${name}`);
    }
  }
  
  // Get new total
  const { count } = await supabase.from('cities').select('*', { count: 'exact', head: true });
  console.log(`\n📊 New total cities in DB: ${count?.toLocaleString()}`);
}

remove();
