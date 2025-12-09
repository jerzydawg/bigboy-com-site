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

// Parse CSV cities
const csvCities = [];
for (const line of lines) {
  // Handle CSV with commas in fields
  const cols = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
  if (cols && cols.length >= 4) {
    const name = cols[1]?.replace(/"/g, '').trim();
    const stateCode = cols[3]?.replace(/"/g, '').trim();
    const population = parseInt(cols[10]) || 0;
    if (name && stateCode) {
      csvCities.push({ name, stateCode, population, originalLine: line });
    }
  }
}

console.log(`CSV has ${csvCities.length.toLocaleString()} cities\n`);

async function analyze() {
  // Get all states
  const { data: states } = await supabase.from('states').select('id, abbreviation');
  const stateMap = {};
  states.forEach(s => stateMap[s.abbreviation] = s.id);

  // Get all DB cities
  console.log('Fetching all cities from database...');
  let allDbCities = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase
      .from('cities')
      .select('name, state_id')
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    allDbCities = [...allDbCities, ...data];
    offset += 1000;
  }
  console.log(`DB has ${allDbCities.length.toLocaleString()} cities\n`);

  // Create lookup set for DB cities (name + state_id)
  const dbLookup = new Set();
  allDbCities.forEach(c => {
    dbLookup.add(`${c.name.toLowerCase()}|${c.state_id}`);
  });

  // Find missing cities
  const missing = [];
  const categories = {
    apostrophe: [],      // O'Brien, O'Fallon
    hyphen: [],          // Multi-word hyphenated
    specialChars: [],    // ñ, ü, etc.
    parentheses: [],     // (CDP), (Township)
    numbers: [],         // Has numbers
    duplicateInCsv: [],  // Appears multiple times in CSV
    otherMissing: []     // No obvious pattern
  };

  // Check for duplicates in CSV first
  const csvDupeCheck = {};
  csvCities.forEach(c => {
    const key = `${c.name.toLowerCase()}|${c.stateCode}`;
    csvDupeCheck[key] = (csvDupeCheck[key] || 0) + 1;
  });

  const seen = new Set();
  for (const city of csvCities) {
    const stateId = stateMap[city.stateCode];
    if (!stateId) continue;

    const key = `${city.name.toLowerCase()}|${stateId}`;
    const csvKey = `${city.name.toLowerCase()}|${city.stateCode}`;
    
    // Skip if already processed this exact city
    if (seen.has(csvKey)) continue;
    seen.add(csvKey);

    if (!dbLookup.has(key)) {
      const isDupeInCsv = csvDupeCheck[csvKey] > 1;
      
      missing.push({
        name: city.name,
        state: city.stateCode,
        population: city.population,
        isDupe: isDupeInCsv,
        dupeCount: csvDupeCheck[csvKey]
      });

      // Categorize
      if (isDupeInCsv) {
        categories.duplicateInCsv.push(city);
      } else if (city.name.includes("'")) {
        categories.apostrophe.push(city);
      } else if (city.name.includes("-")) {
        categories.hyphen.push(city);
      } else if (/[ñüéáíóúàèìòùâêîôûäëïöü]/i.test(city.name)) {
        categories.specialChars.push(city);
      } else if (/\(.*\)/.test(city.name)) {
        categories.parentheses.push(city);
      } else if (/\d/.test(city.name)) {
        categories.numbers.push(city);
      } else {
        categories.otherMissing.push(city);
      }
    }
  }

  console.log('='.repeat(60));
  console.log('MISSING CITIES ANALYSIS');
  console.log('='.repeat(60));
  console.log(`\nTotal Missing: ${missing.length.toLocaleString()}\n`);

  console.log('BREAKDOWN BY CATEGORY:');
  console.log('-'.repeat(40));
  console.log(`1. Duplicates in CSV:     ${categories.duplicateInCsv.length}`);
  console.log(`2. Apostrophe names:      ${categories.apostrophe.length}`);
  console.log(`3. Hyphenated names:      ${categories.hyphen.length}`);
  console.log(`4. Special characters:    ${categories.specialChars.length}`);
  console.log(`5. Parentheses (CDP etc): ${categories.parentheses.length}`);
  console.log(`6. Contains numbers:      ${categories.numbers.length}`);
  console.log(`7. Other/Unknown:         ${categories.otherMissing.length}`);
  console.log('-'.repeat(40));

  // Show examples for each category
  console.log('\n\n=== EXAMPLES BY CATEGORY ===\n');

  if (categories.duplicateInCsv.length > 0) {
    console.log('📋 DUPLICATES IN CSV (same city appears multiple times):');
    categories.duplicateInCsv.slice(0, 10).forEach(c => {
      console.log(`   ${c.name}, ${c.stateCode} (appears ${csvDupeCheck[`${c.name.toLowerCase()}|${c.stateCode}`]}x)`);
    });
    console.log('');
  }

  if (categories.apostrophe.length > 0) {
    console.log("🔤 APOSTROPHE NAMES (O'Brien, etc):");
    categories.apostrophe.slice(0, 15).forEach(c => {
      console.log(`   ${c.name}, ${c.stateCode}`);
    });
    console.log('');
  }

  if (categories.hyphen.length > 0) {
    console.log('➖ HYPHENATED NAMES:');
    categories.hyphen.slice(0, 15).forEach(c => {
      console.log(`   ${c.name}, ${c.stateCode}`);
    });
    console.log('');
  }

  if (categories.specialChars.length > 0) {
    console.log('🌐 SPECIAL CHARACTERS (ñ, ü, etc):');
    categories.specialChars.slice(0, 10).forEach(c => {
      console.log(`   ${c.name}, ${c.stateCode}`);
    });
    console.log('');
  }

  if (categories.parentheses.length > 0) {
    console.log('📦 PARENTHESES (CDP, Township, etc):');
    categories.parentheses.slice(0, 15).forEach(c => {
      console.log(`   ${c.name}, ${c.stateCode}`);
    });
    console.log('');
  }

  if (categories.numbers.length > 0) {
    console.log('🔢 CONTAINS NUMBERS:');
    categories.numbers.slice(0, 10).forEach(c => {
      console.log(`   ${c.name}, ${c.stateCode}`);
    });
    console.log('');
  }

  if (categories.otherMissing.length > 0) {
    console.log('❓ OTHER/UNKNOWN REASON:');
    categories.otherMissing.slice(0, 20).forEach(c => {
      console.log(`   ${c.name}, ${c.stateCode} (pop: ${c.population?.toLocaleString() || 0})`);
    });
    console.log('');
  }

  // Save full list to file
  fs.writeFileSync('missing-cities-full.json', JSON.stringify({
    summary: {
      total: missing.length,
      duplicatesInCsv: categories.duplicateInCsv.length,
      apostrophe: categories.apostrophe.length,
      hyphen: categories.hyphen.length,
      specialChars: categories.specialChars.length,
      parentheses: categories.parentheses.length,
      numbers: categories.numbers.length,
      other: categories.otherMissing.length
    },
    categories: {
      duplicateInCsv: categories.duplicateInCsv.map(c => ({ name: c.name, state: c.stateCode })),
      apostrophe: categories.apostrophe.map(c => ({ name: c.name, state: c.stateCode })),
      hyphen: categories.hyphen.map(c => ({ name: c.name, state: c.stateCode })),
      specialChars: categories.specialChars.map(c => ({ name: c.name, state: c.stateCode })),
      parentheses: categories.parentheses.map(c => ({ name: c.name, state: c.stateCode })),
      numbers: categories.numbers.map(c => ({ name: c.name, state: c.stateCode })),
      other: categories.otherMissing.map(c => ({ name: c.name, state: c.stateCode, population: c.population }))
    }
  }, null, 2));

  console.log('\n✅ Full list saved to missing-cities-full.json');
}

analyze();
