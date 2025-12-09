import { createClient } from '@supabase/supabase-js';
import { createCitySlug, generateCityNameVariationsForLookup } from '../src/lib/slug-utils.js';

const supabase = createClient(
  'https://apsdwdudkqnfwdfcbfaz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwc2R3ZHVka3FuZndkZmNiZmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjE3OTEzNiwiZXhwIjoyMDY3NzU1MTM2fQ.pL1KpGNgmzd_Z2h3YmsqqW1-C8gruG08Ae3FgULgKK0'
);

const WORKERS = 50;
const BASE_URL = 'https://government-phone.co';

async function testUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return { url, status: res.status, ok: res.ok };
  } catch (e) {
    return { url, status: 0, ok: false, error: e.message };
  }
}

async function main() {
  // Get all cities
  console.log('Fetching cities from database...');
  let allCities = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase
      .from('cities')
      .select('name, state_id, states(abbreviation)')
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    allCities = [...allCities, ...data];
    offset += 1000;
    process.stdout.write(`\rFetched ${allCities.length} cities...`);
  }
  console.log(`\n\nTesting ${allCities.length} URLs with ${WORKERS} parallel workers...\n`);

  // Build URLs
  const urls = allCities.map(c => {
    const slug = createCitySlug(c.name);
    const state = c.states?.abbreviation?.toLowerCase() || 'unknown';
    return `${BASE_URL}/${state}/${slug}/`;
  });

  let completed = 0;
  let passed = 0;
  let failed = [];
  const startTime = Date.now();

  // Process in batches
  for (let i = 0; i < urls.length; i += WORKERS) {
    const batch = urls.slice(i, i + WORKERS);
    const results = await Promise.all(batch.map(testUrl));
    
    for (const r of results) {
      completed++;
      if (r.ok) {
        passed++;
      } else {
        failed.push(r);
      }
    }
    
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = completed / elapsed;
    const eta = (urls.length - completed) / rate;
    process.stdout.write(`\r✅ ${passed} | ❌ ${failed.length} | ${completed}/${urls.length} (${rate.toFixed(0)}/s, ETA: ${eta.toFixed(0)}s)   `);
  }

  console.log('\n\n' + '='.repeat(60));
  console.log(`RESULTS: ${passed} passed, ${failed.length} failed`);
  
  if (failed.length > 0 && failed.length <= 50) {
    console.log('\nFailed URLs:');
    failed.forEach(f => console.log(`  ${f.status}: ${f.url}`));
  } else if (failed.length > 50) {
    console.log(`\nFirst 50 failed URLs:`);
    failed.slice(0, 50).forEach(f => console.log(`  ${f.status}: ${f.url}`));
  }
}

main();
