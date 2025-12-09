import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://apsdwdudkqnfwdfcbfaz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwc2R3ZHVka3FuZndkZmNiZmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjE3OTEzNiwiZXhwIjoyMDY3NzU1MTM2fQ.pL1KpGNgmzd_Z2h3YmsqqW1-C8gruG08Ae3FgULgKK0'
);

async function verifyStateCities() {
  console.log('Fetching all states from Supabase...\n');
  
  const { data: states, error: statesError } = await supabase
    .from('states')
    .select('id, name, abbreviation')
    .order('name');
  
  if (statesError) {
    console.error('Error fetching states:', statesError);
    return;
  }
  
  console.log(`Found ${states.length} states\n`);
  console.log('State | Abbr | Cities in DB');
  console.log('------|------|-------------');
  
  let totalCities = 0;
  const stateCounts = [];
  
  for (const state of states) {
    const { count, error } = await supabase
      .from('cities')
      .select('id', { count: 'exact', head: true })
      .eq('state_id', state.id);
    
    if (error) {
      console.log(`${state.name} | ${state.abbreviation} | ERROR`);
    } else {
      console.log(`${state.name.padEnd(20)} | ${state.abbreviation} | ${count}`);
      totalCities += count || 0;
      stateCounts.push({ name: state.name, abbr: state.abbreviation, count });
    }
  }
  
  console.log('\n===========================================');
  console.log(`TOTAL STATES: ${states.length}`);
  console.log(`TOTAL CITIES: ${totalCities.toLocaleString()}`);
  console.log('===========================================\n');
  
  // Show top 10 states by city count
  console.log('Top 10 States by City Count:');
  stateCounts.sort((a, b) => b.count - a.count);
  stateCounts.slice(0, 10).forEach((s, i) => {
    console.log(`${i + 1}. ${s.name} (${s.abbr}): ${s.count.toLocaleString()}`);
  });
}

verifyStateCities();
