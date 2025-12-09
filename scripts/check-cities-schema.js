import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://apsdwdudkqnfwdfcbfaz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwc2R3ZHVka3FuZndkZmNiZmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjE3OTEzNiwiZXhwIjoyMDY3NzU1MTM2fQ.pL1KpGNgmzd_Z2h3YmsqqW1-C8gruG08Ae3FgULgKK0'
);

async function checkSchema() {
  // Get one city to see the columns
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('Error:', error.message);
    return;
  }
  
  console.log('Cities table columns:');
  console.log(Object.keys(data[0]));
  console.log('\nSample row:');
  console.log(data[0]);
}

checkSchema();
