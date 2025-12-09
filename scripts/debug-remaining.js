import { generateCityNameVariationsForLookup } from '../src/lib/slug-utils.js';

const slugs = [
  'lees-summit',
  'the-university-of-virginias-college-at-wise'
];

for (const slug of slugs) {
  const v = generateCityNameVariationsForLookup(slug);
  console.log(`"${slug}":`);
  v.forEach(x => console.log(`   - "${x}"`));
  console.log('');
}
