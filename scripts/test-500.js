import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const WORKERS = 500;
const TIMEOUT = 8;

// Extract URLs from all sitemaps
function extractUrls() {
  const urls = [];
  const sitemapDir = './public';
  const files = fs.readdirSync(sitemapDir).filter(f => f.startsWith('sitemap') && f.endsWith('.xml') && f !== 'sitemap.xml');
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(sitemapDir, file), 'utf-8');
    const matches = content.match(/<loc>([^<]+)<\/loc>/g) || [];
    for (const m of matches) {
      const url = m.replace(/<\/?loc>/g, '');
      if (!url.endsWith('.xml')) urls.push(url);
    }
  }
  return [...new Set(urls)];
}

async function testUrl(url) {
  return new Promise((resolve) => {
    const curl = spawn('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', '-L', '--max-time', String(TIMEOUT), url]);
    let code = '';
    curl.stdout.on('data', d => code += d);
    curl.on('close', () => resolve({ url, status: parseInt(code) || 0 }));
    curl.on('error', () => resolve({ url, status: 0 }));
  });
}

async function main() {
  const urls = extractUrls();
  console.log(`\n🚀 Testing ${urls.length} URLs with ${WORKERS} parallel workers\n`);
  
  const failed = [];
  let done = 0;
  const start = Date.now();
  
  // Process in chunks
  for (let i = 0; i < urls.length; i += WORKERS) {
    const chunk = urls.slice(i, i + WORKERS);
    const results = await Promise.all(chunk.map(testUrl));
    
    for (const r of results) {
      done++;
      if (r.status !== 200) {
        failed.push(r);
      }
    }
    
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const rate = (done / elapsed * 60).toFixed(0);
    process.stdout.write(`\r✓ ${done}/${urls.length} tested | ${failed.length} failed | ${rate} URLs/min | ${elapsed}s elapsed`);
  }
  
  console.log('\n');
  
  if (failed.length === 0) {
    console.log('✅ ALL URLS PASSED!');
  } else {
    console.log(`❌ ${failed.length} URLs failed:\n`);
    failed.slice(0, 50).forEach(f => console.log(`   ${f.status}: ${f.url}`));
    fs.writeFileSync('sitemap-failures.json', JSON.stringify(failed, null, 2));
  }
  
  console.log(`\n⏱️  Total time: ${((Date.now() - start) / 1000).toFixed(1)}s`);
}

main();
