import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://apsdwdudkqnfwdfcbfaz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwc2R3ZHVka3FuZndkZmNiZmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjE3OTEzNiwiZXhwIjoyMDY3NzU1MTM2fQ.pL1KpGNgmzd_Z2h3YmsqqW1-C8gruG08Ae3FgULgKK0'
);

const citiesToRemove = [
  { name: 'Cesar Chavez', state: 'TX' },
  { name: 'César Chávez', state: 'TX' },
  { name: 'Kepel', state: 'CA' },
  { name: 'Lake Landor', state: 'VA' },
  { name: "Lee's Summit", state: 'MO' },
  { name: 'Lees Summit', state: 'MO' },
  { name: 'SNPJ', state: 'PA' },
  { name: "The University of Virginia's College at Wise", state: 'VA' },
  { name: 'Utqiaġvik', state: 'AK' },
  { name: 'UtqiagÌvik', state: 'AK' },
  { name: 'Utqiagivik', state: 'AK' }
];

async function removeCities() {
  console.log('Removing failed cities from database...\n');
  
  for (const { name, state } of citiesToRemove) {
    // Get state ID
    const { data: stateData } = await supabase
      .from('states')
      .select('id')
      .eq('abbreviation', state)
      .single();
    
    if (!stateData) {
      console.log(`State ${state} not found, skipping ${name}`);
      continue;
    }
    
    // Delete city
    const { data, error } = await supabase
      .from('cities')
      .delete()
      .eq('state_id', stateData.id)
      .ilike('name', name)
      .select();
    
    if (error) {
      console.log(`Error deleting "${name}" (${state}):`, error.message);
    } else if (data && data.length > 0) {
      console.log(`✓ Deleted: ${name}, ${state}`);
    } else {
      console.log(`- Not found: ${name}, ${state}`);
    }
  }
  
  console.log('\n✅ Done removing cities');
}

removeCities();
