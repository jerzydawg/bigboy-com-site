import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://apsdwdudkqnfwdfcbfaz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwc2R3ZHVka3FuZndkZmNiZmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjE3OTEzNiwiZXhwIjoyMDY3NzU1MTM2fQ.pL1KpGNgmzd_Z2h3YmsqqW1-C8gruG08Ae3FgULgKK0'
);

const searchTerms = [
  { term: "Cesar", state: "TX" },
  { term: "Kepel", state: "CA" },
  { term: "Landor", state: "VA" },
  { term: "Martin", state: "MD" },
  { term: "Germantown", state: "ND" },
  { term: "Prince", state: "IN" },
  { term: "Reile", state: "ND" },
  { term: "Rocky Boy", state: "MT" },
  { term: "SNPJ", state: "PA" },
  { term: "Salin", state: "TX" },
  { term: "Sperry", state: "ND" },
  { term: "St. John", state: "MN" },
  { term: "St. Mary", state: "AK" },
  { term: "St Mary", state: "CO" },
  { term: "Utqia", state: "AK" }
];

async function check() {
  for (const { term, state } of searchTerms) {
    const { data: stateData } = await supabase
      .from('states')
      .select('id')
      .eq('abbreviation', state)
      .single();
    
    if (!stateData) continue;
    
    const { data } = await supabase
      .from('cities')
      .select('name')
      .eq('state_id', stateData.id)
      .ilike('name', `%${term}%`)
      .limit(5);
    
    console.log(`"${term}" in ${state}:`, data?.map(c => c.name).join(', ') || 'NOT FOUND');
  }
}

check();
