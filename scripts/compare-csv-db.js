import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  'https://apsdwdudkqnfwdfcbfaz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwc2R3ZHVka3FuZndkZmNiZmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjE3OTEzNiwiZXhwIjoyMDY3NzU1MTM2fQ.pL1KpGNgmzd_Z2h3YmsqqW1-C8gruG08Ae3FgULgKK0'
);

// Read CSV
const csvPath = process.env.HOME + '/Downloads/Telegram Desktop/us-cities.csv';
const csvContent = fs.readFileSync(csvPath, 'utf8');
const lines = csvContent.split('\n').slice(1).filter(l => l.trim());

// Count cities per state in CSV
const csvCounts = {};
let csvTotal = 0;
for (const line of lines) {
  const cols = line.split(',');
  const stateCode = cols[3];
  if (stateCode) {
    csvCounts[stateCode] = (csvCounts[stateCode] || 0) + 1;
    csvTotal++;
  }
}

console.log(`CSV Total Cities: ${csvTotal.toLocaleString()}\n`);

// Get DB counts
async function compare() {
  const { data: states } = await supabase
    .from('states')
    .select('id, abbreviation, name')
    .order('abbreviation');
  
  console.log('State | CSV Count | DB Count | Diff');
  console.log('------|-----------|----------|-----');
  
  let dbTotal = 0;
  let mismatches = [];
  
  for (const state of states) {
    const csvCount = csvCounts[state.abbreviation] || 0;
    
    const { count: dbCount } = await supabase
      .from('cities')
      .select('id', { count: 'exact', head: true })
      .eq('state_id', state.id);
    
    dbTotal += dbCount || 0;
    const diff = (dbCount || 0) - csvCount;
    const diffStr = diff === 0 ? '✓' : (diff > 0 ? `+${diff}` : diff);
    
    if (diff !== 0) {
      mismatches.push({ state: state.abbreviation, csv: csvCount, db: dbCount, diff });
    }
    
    console.log(`${state.abbreviation.padEnd(5)} | ${String(csvCount).padEnd(9)} | ${String(dbCount).padEnd(8)} | ${diffStr}`);
  }
  
  console.log('\n============================================');
  console.log(`CSV Total:  ${csvTotal.toLocaleString()}`);
  console.log(`DB Total:   ${dbTotal.toLocaleString()}`);
  console.log(`Difference: ${(dbTotal - csvTotal).toLocaleString()}`);
  console.log('============================================\n');
  
  if (mismatches.length > 0) {
    console.log('MISMATCHES:');
    mismatches.forEach(m => {
      console.log(`  ${m.state}: CSV has ${m.csv}, DB has ${m.db} (${m.diff > 0 ? '+' : ''}${m.diff})`);
    });
  }
}

compare();
