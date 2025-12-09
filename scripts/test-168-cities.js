import { createCitySlug } from '../src/lib/slug-utils.js';
import fs from 'fs';

const BASE_URL = 'https://government-phone.co';
const WORKERS = 10;

// Read the added cities
const addedData = JSON.parse(fs.readFileSync('added-cities.json', 'utf8'));
const newCities = addedData.added.filter(c => 
  !c.city.includes('University') && !c.city.includes('Rutgers') && !c.city.includes('Penn State')
);

async function testUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(15000) });
    return { url, status: res.status, ok: res.status === 200 };
  } catch (e) {
    return { url, status: 0, ok: false, error: e.message };
  }
}

async function main() {
  const urls = newCities.map(c => ({
    url: `${BASE_URL}/${c.state.toLowerCase()}/${createCitySlug(c.city)}/`,
    city: c.city,
    state: c.state,
    pop: c.population
  }));

  console.log(`Testing ${urls.length} new city URLs with ${WORKERS} workers...\n`);

  let passed = 0, failed = [];
  
  for (let i = 0; i < urls.length; i += WORKERS) {
    const batch = urls.slice(i, i + WORKERS);
    const results = await Promise.all(batch.map(async u => {
      const r = await testUrl(u.url);
      return { ...r, city: u.city, state: u.state, pop: u.pop };
    }));
    
    for (const r of results) {
      if (r.ok) passed++;
      else failed.push(r);
    }
    process.stdout.write(`\r✅ ${passed} | ❌ ${failed.length} | ${i + batch.length}/${urls.length}`);
  }

  console.log(`\n\n${'='.repeat(60)}`);
  console.log(`RESULTS: ${passed} passed, ${failed.length} failed\n`);

  if (failed.length > 0) {
    console.log('Failed URLs:');
    failed.sort((a,b) => b.pop - a.pop).forEach(f => 
      console.log(`  ${f.status}: ${f.city}, ${f.state} (pop: ${f.pop?.toLocaleString()}) → ${f.url}`)
    );
  }
}

main();
