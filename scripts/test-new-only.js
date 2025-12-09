import { createCitySlug } from '../src/lib/slug-utils.js';

const BASE_URL = 'https://government-phone.co';
const WORKERS = 50;

// The 168 new cities we added (minus universities)
const newCities = [
  { name: "Jacksons' Gap", state: "AL" },
  { name: "O'Kean", state: "AR" },
  { name: "Hill 'n Dale", state: "FL" },
  { name: "Land O' Lakes", state: "FL" },
  { name: "Town 'n' Country", state: "FL" },
  { name: "O'Fallon", state: "IL" },
  { name: "O'Brien", state: "MN" },
  { name: "Fountain N' Lakes", state: "MO" },
  { name: "Lee's Summit", state: "MO" },
  { name: "O'Fallon", state: "MO" },
  { name: "O'Neill", state: "NE" },
  { name: "O'Brien", state: "OR" },
  { name: "O'Hara", state: "PA" },
  { name: "O'Neil", state: "SD" },
  { name: "O'Brien", state: "TX" },
  { name: "O'Donnell", state: "TX" },
  { name: "Port O'Connor", state: "TX" },
  { name: "Chain O' Lakes", state: "WI" },
  { name: "Land O'Lakes", state: "WI" },
  { name: "Harding-Birch Lakes", state: "AK" },
  { name: "Helena-West Helena", state: "AR" },
  { name: "Parsippany-Troy Hills", state: "NJ" },
  { name: "Port St. Lucie", state: "FL" },
  { name: "Port St. Joe", state: "FL" },
  { name: "Port St. John", state: "FL" },
  { name: "East St. Louis", state: "IL" },
  { name: "Bay St. Louis", state: "MS" },
  { name: "Sault Ste. Marie", state: "MI" },
  { name: "Upper St. Clair", state: "PA" },
  { name: "César Chávez", state: "TX" },
  { name: "Mt. Bullion", state: "CA" },
  { name: "Wright-Patterson AFB", state: "OH" },
  { name: "E. Lopez", state: "TX" },
  { name: "San Buenaventura (Ventura)", state: "CA" },
  { name: "El Paso de Robles (Paso Robles)", state: "CA" },
];

async function testUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(10000) });
    return { url, status: res.status, ok: res.ok };
  } catch (e) {
    return { url, status: 0, ok: false, error: e.message };
  }
}

async function main() {
  const urls = newCities.map(c => {
    const slug = createCitySlug(c.name);
    return { url: `${BASE_URL}/${c.state.toLowerCase()}/${slug}/`, city: c.name, state: c.state };
  });

  console.log(`Testing ${urls.length} new city URLs...\n`);

  const results = await Promise.all(urls.map(async (u) => {
    const r = await testUrl(u.url);
    return { ...r, city: u.city, state: u.state };
  }));

  const passed = results.filter(r => r.ok);
  const failed = results.filter(r => !r.ok);

  console.log(`✅ Passed: ${passed.length}`);
  console.log(`❌ Failed: ${failed.length}\n`);

  if (failed.length > 0) {
    console.log('Failed URLs:');
    failed.forEach(f => console.log(`  ${f.status}: ${f.city}, ${f.state} → ${f.url}`));
  }
}

main();
