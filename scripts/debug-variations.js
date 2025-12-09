import { generateCityNameVariationsForLookup } from '../src/lib/slug-utils.js';

const slugs = [
  'martins-additions',
  'princes-lakes', 
  'reiles-acres',
  'st-johns-university'
];

for (const slug of slugs) {
  const v = generateCityNameVariationsForLookup(slug);
  console.log(`"${slug}":`);
  v.slice(0, 10).forEach(x => console.log(`   - "${x}"`));
  console.log('');
}
