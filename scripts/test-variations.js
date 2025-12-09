import { generateCityNameVariationsForLookup } from '../src/lib/slug-utils.js';

const testSlugs = [
  'baileys-crossroads',
  'canon-city',
  'coeur-dalene',
  'lanse',
  'lees-summit',
  'dlo',
  'morgans-point',
  'sullivans-island'
];

console.log('Testing slug variations:\n');

for (const slug of testSlugs) {
  const variations = generateCityNameVariationsForLookup(slug);
  console.log(`"${slug}" → ${variations.length} variations:`);
  variations.slice(0, 8).forEach(v => console.log(`   - "${v}"`));
  console.log('');
}
