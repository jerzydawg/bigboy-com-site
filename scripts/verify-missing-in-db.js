import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  'https://apsdwdudkqnfwdfcbfaz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwc2R3ZHVka3FuZndkZmNiZmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjE3OTEzNiwiZXhwIjoyMDY3NzU1MTM2fQ.pL1KpGNgmzd_Z2h3YmsqqW1-C8gruG08Ae3FgULgKK0'
);

const missing = JSON.parse(fs.readFileSync('missing-cities-full.json', 'utf8'));

async function verify() {
  const { data: states } = await supabase.from('states').select('id, abbreviation');
  const stateMap = {};
  states.forEach(s => stateMap[s.abbreviation] = s.id);
  
  const allMissing = [
    ...missing.categories.apostrophe,
    ...missing.categories.hyphen,
    ...missing.categories.specialChars,
    ...missing.categories.parentheses,
    ...missing.categories.other
  ];
  
  console.log(`Checking ${allMissing.length} missing cities against database...\n`);
  
  const foundInDb = [];
  const notFoundInDb = [];
  
  for (const city of allMissing) {
    const stateId = stateMap[city.state];
    if (!stateId) continue;
    
    // Try exact match first
    const { data: exact } = await supabase
      .from('cities')
      .select('name')
      .eq('state_id', stateId)
      .ilike('name', city.name)
      .limit(1);
    
    if (exact && exact.length > 0) {
      foundInDb.push({ csv: city.name, db: exact[0].name, state: city.state });
      continue;
    }
    
    // Generate variations to try
    const variations = [];
    
    // Apostrophe variations
    if (city.name.includes("'")) {
      variations.push(city.name.replace(/'/g, ''));
    }
    
    // Hyphen/space variations
    if (city.name.includes('-')) {
      variations.push(city.name.replace(/-/g, ' '));
    }
    if (city.name.includes(' ') && !city.name.includes('-')) {
      variations.push(city.name.replace(/ /g, '-'));
    }
    
    // St./St variations
    if (city.name.includes('St.')) {
      variations.push(city.name.replace(/St\./g, 'St'));
    }
    if (city.name.includes('St ') && !city.name.includes('St.')) {
      variations.push(city.name.replace(/St /g, 'St. '));
    }
    
    // Ste./Ste variations
    if (city.name.includes('Ste.')) {
      variations.push(city.name.replace(/Ste\./g, 'Ste'));
    }
    if (city.name.includes('Ste ') && !city.name.includes('Ste.')) {
      variations.push(city.name.replace(/Ste /g, 'Ste. '));
    }
    
    // Remove parenthetical suffixes
    if (city.name.includes('(')) {
      variations.push(city.name.replace(/\s*\([^)]+\)/g, '').trim());
      // Also try just the part before parentheses
      const basePart = city.name.split('(')[0].trim();
      variations.push(basePart);
    }
    
    // Try to find matches
    let found = false;
    for (const v of variations) {
      const { data: varMatch } = await supabase
        .from('cities')
        .select('name')
        .eq('state_id', stateId)
        .ilike('name', v)
        .limit(1);
      
      if (varMatch && varMatch.length > 0) {
        foundInDb.push({ csv: city.name, db: varMatch[0].name, state: city.state, variation: v });
        found = true;
        break;
      }
    }
    
    if (!found) {
      // Look for similar names
      const firstWord = city.name.split(/[\s(-]/)[0];
      const { data: similar } = await supabase
        .from('cities')
        .select('name')
        .eq('state_id', stateId)
        .ilike('name', `${firstWord}%`)
        .limit(5);
      
      notFoundInDb.push({
        name: city.name,
        state: city.state,
        similarInDb: similar?.map(s => s.name) || []
      });
    }
  }
  
  console.log('='.repeat(60));
  console.log('VERIFICATION RESULTS');
  console.log('='.repeat(60));
  console.log(`\n✅ Found in DB (different format): ${foundInDb.length}`);
  console.log(`❌ Truly missing from DB: ${notFoundInDb.length}`);
  
  if (foundInDb.length > 0) {
    console.log('\n--- FOUND IN DB (different name format) ---');
    foundInDb.forEach(c => {
      console.log(`   CSV: "${c.csv}" → DB: "${c.db}" (${c.state})`);
    });
  }
  
  if (notFoundInDb.length > 0) {
    console.log('\n--- TRULY MISSING FROM DB ---');
    notFoundInDb.forEach(c => {
      const similar = c.similarInDb.length > 0 ? `\n      Similar in DB: ${c.similarInDb.join(', ')}` : '';
      console.log(`   ${c.name}, ${c.state}${similar}`);
    });
  }
  
  fs.writeFileSync('missing-cities-verified.json', JSON.stringify({ foundInDb, notFoundInDb }, null, 2));
  console.log('\n✅ Results saved to missing-cities-verified.json');
}

verify();
