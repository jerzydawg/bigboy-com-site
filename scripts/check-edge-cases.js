import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://apsdwdudkqnfwdfcbfaz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwc2R3ZHVka3FuZndkZmNiZmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjE3OTEzNiwiZXhwIjoyMDY3NzU1MTM2fQ.pL1KpGNgmzd_Z2h3YmsqqW1-C8gruG08Ae3FgULgKK0'
);

const edgeCases = [
  "Encantada-Ranchito-El Calaboz",
  "East St. Louis (Township)",
  "Ste. Marie (Township)"
];

async function check() {
  for (const name of edgeCases) {
    const { data } = await supabase.from('cities').select('name, population').ilike('name', name);
    if (data && data.length > 0) {
      console.log(`${data[0].name}: population ${data[0].population}`);
    }
  }
}

check();
