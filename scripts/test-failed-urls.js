/**
 * Test only the previously failed URLs
 */

import fs from 'fs';

const failedUrls = [
  'https://government-phone.co/va/baileys-crossroads/',
  'https://government-phone.co/tx/baileys-prairie/',
  'https://government-phone.co/wa/barneys-junction/',
  'https://government-phone.co/la/bayou-lourse/',
  'https://government-phone.co/il/bois-darc/',
  'https://government-phone.co/va/boswells-corner/',
  'https://government-phone.co/nc/cajahs-mountain/',
  'https://government-phone.co/il/campbells-island/',
  'https://government-phone.co/nm/canada-de-los-alamos/',
  'https://government-phone.co/nm/canon/',
  'https://government-phone.co/co/canon-city/',
  'https://government-phone.co/nm/canoncito/',
  'https://government-phone.co/nm/canones/',
  'https://government-phone.co/nd/captains-landing/',
  'https://government-phone.co/tx/carls-corner/',
  'https://government-phone.co/tx/cesar-chavez/',
  'https://government-phone.co/il/cheneys-grove/',
  'https://government-phone.co/ak/clarks-point/',
  'https://government-phone.co/id/coeur-dalene/',
  'https://government-phone.co/tx/dhanis/',
  'https://government-phone.co/ms/diberville/',
  'https://government-phone.co/ms/dlo/',
  'https://government-phone.co/nm/dona-ana/',
  'https://government-phone.co/nm/espanola/',
  'https://government-phone.co/ny/goldens-bridge/',
  'https://government-phone.co/nh/harts-location/',
  'https://government-phone.co/tx/jf-villareal/',
  'https://government-phone.co/ca/kepel/',
  'https://government-phone.co/mi/lanse/',
  'https://government-phone.co/mi/lanse-township/',
  'https://government-phone.co/ca/la-canada-flintridge/',
  'https://government-phone.co/va/lake-landor/',
  'https://government-phone.co/mo/lees-summit/',
  'https://government-phone.co/tx/lopeno/',
  'https://government-phone.co/md/martins-additions/',
  'https://government-phone.co/tx/millers-cove/',
  'https://government-phone.co/tx/morgans-point/',
  'https://government-phone.co/tx/morgans-point-resort/',
  'https://government-phone.co/nd/new-germantownschiller/',
  'https://government-phone.co/tn/parkers-crossroads/',
  'https://government-phone.co/nm/pena-blanca/',
  'https://government-phone.co/nm/penasco/',
  'https://government-phone.co/ca/pinon-hills/',
  'https://government-phone.co/in/princes-lakes/',
  'https://government-phone.co/nd/reiles-acres/',
  'https://government-phone.co/mt/rocky-boys-agency/',
  'https://government-phone.co/pa/snpj/',
  'https://government-phone.co/tx/salineno/',
  'https://government-phone.co/tx/salineno-north/',
  'https://government-phone.co/fl/sewalls-point/',
  'https://government-phone.co/nd/sperrygoodrich/',
  'https://government-phone.co/nc/spiveys-corner/',
  'https://government-phone.co/mn/st-johns-university/',
  'https://government-phone.co/ak/st-marys/',
  'https://government-phone.co/co/st-marys/',
  'https://government-phone.co/sc/sullivans-island/',
  'https://government-phone.co/va/the-university-of-virginias-college-at-wise/',
  'https://government-phone.co/tn/thompsons-station/',
  'https://government-phone.co/ak/utqiagivik/',
  'https://government-phone.co/nc/wilsons-mills/'
];

async function testUrl(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 SitemapChecker/1.0' }
    });
    
    clearTimeout(timeoutId);
    
    return {
      url: url.replace('https://government-phone.co', ''),
      status: response.status,
      ok: response.status === 200
    };
  } catch (error) {
    return {
      url: url.replace('https://government-phone.co', ''),
      status: 'ERROR',
      ok: false,
      reason: error.message
    };
  }
}

async function main() {
  console.log('🔄 Testing 60 previously failed URLs...\n');
  
  const results = await Promise.all(failedUrls.map(url => testUrl(url)));
  
  const passed = results.filter(r => r.ok);
  const failed = results.filter(r => !r.ok);
  
  console.log('✅ PASSED:', passed.length);
  passed.forEach(r => console.log(`   ${r.url} → ${r.status}`));
  
  console.log('\n❌ STILL FAILING:', failed.length);
  failed.forEach(r => console.log(`   ${r.url} → ${r.status} ${r.reason || ''}`));
  
  console.log(`\n📊 Result: ${passed.length}/${failedUrls.length} fixed`);
}

main();


