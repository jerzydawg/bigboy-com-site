import fs from 'fs';

const csvPath = process.env.HOME + '/Downloads/Telegram Desktop/us-cities.csv';
const csvContent = fs.readFileSync(csvPath, 'utf8');
const lines = csvContent.split('\n').slice(1).filter(l => l.trim());

// Count occurrences
const cityCount = {};
let totalRows = 0;

for (const line of lines) {
  const cols = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
  if (cols && cols.length >= 4) {
    const name = cols[1]?.replace(/"/g, '').trim();
    const stateCode = cols[3]?.replace(/"/g, '').trim();
    if (name && stateCode) {
      const key = `${name}|${stateCode}`;
      cityCount[key] = (cityCount[key] || 0) + 1;
      totalRows++;
    }
  }
}

const uniqueCities = Object.keys(cityCount).length;
const duplicateEntries = totalRows - uniqueCities;

console.log('='.repeat(60));
console.log('CSV DUPLICATE ANALYSIS');
console.log('='.repeat(60));
console.log(`\nTotal rows in CSV:     ${totalRows.toLocaleString()}`);
console.log(`Unique city+state:     ${uniqueCities.toLocaleString()}`);
console.log(`Duplicate entries:     ${duplicateEntries.toLocaleString()}`);
console.log('');

// Find cities that appear more than once
const dupes = Object.entries(cityCount)
  .filter(([k, v]) => v > 1)
  .sort((a, b) => b[1] - a[1]);

console.log(`\nCities appearing multiple times: ${dupes.length}`);
console.log('-'.repeat(40));

// Show top dupes
console.log('\nTop 30 duplicated cities:');
dupes.slice(0, 30).forEach(([key, count]) => {
  const [name, state] = key.split('|');
  console.log(`   ${name}, ${state}: ${count}x`);
});

// Explain the math
console.log('\n' + '='.repeat(60));
console.log('WHY THE NUMBERS DIFFER:');
console.log('='.repeat(60));
console.log(`CSV rows:              47,172`);
console.log(`CSV unique cities:     ${uniqueCities.toLocaleString()}`);
console.log(`DB cities:             43,519`);
console.log(`Actually missing:      ${uniqueCities - 43519}`);
console.log('');
console.log('The CSV has duplicate rows (same city appearing multiple times,');
console.log('likely for different zip codes or county overlaps).');
