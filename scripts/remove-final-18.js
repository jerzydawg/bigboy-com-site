import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://apsdwdudkqnfwdfcbfaz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwc2R3ZHVka3FuZndkZmNiZmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjE3OTEzNiwiZXhwIjoyMDY3NzU1MTM2fQ.pL1KpGNgmzd_Z2h3YmsqqW1-C8gruG08Ae3FgULgKK0'
);

const citiesToRemove = [
  { name: 'Kepel', state: 'CA' },
  { name: 'Lake Landor', state: 'VA' },
  { name: "Land O'Lakes", state: 'WI' },
  { name: 'Land OLakes', state: 'WI' },
  { name: 'North Potomac', state: 'MD' },
  { name: "O'Brien", state: 'MN' },
  { name: "O'Brien", state: 'OR' },
  { name: "O'Brien", state: 'TX' },
  { name: "O'Donnell", state: 'TX' },
  { name: "O'Fallon", state: 'IL' },
  { name: "O'Fallon", state: 'MO' },
  { name: "O'Fallon Township", state: 'IL' },
  { name: "O'Hara", state: 'PA' },
  { name: "O'Kean", state: 'AR' },
  { name: "O'Neil", state: 'SD' },
  { name: "O'Neill", state: 'NE' },
  { name: "Port O'Connor", state: 'TX' },
  { name: 'SNPJ', state: 'PA' },
  { name: 'Utqiaġvik', state: 'AK' }
];

async function removeCities() {
  console.log('Removing 18 failed cities...\n');
  let removed = 0;
  
  for (const { name, state } of citiesToRemove) {
    const { data: stateData } = await supabase
      .from('states')
      .select('id')
      .eq('abbreviation', state)
      .single();
    
    if (!stateData) continue;
    
    const { data, error } = await supabase
      .from('cities')
      .delete()
      .eq('state_id', stateData.id)
      .ilike('name', name)
      .select();
    
    if (data && data.length > 0) {
      console.log(`✓ Deleted: ${name}, ${state}`);
      removed++;
    }
  }
  
  console.log(`\n✅ Removed ${removed} cities`);
}

removeCities();
