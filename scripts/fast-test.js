import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const WORKERS = 100;
const TIMEOUT = 8;

// Extract URLs from sitemaps
function getUrls() {
  const dir = './public';
  const files = fs.readdirSync(dir).filter(f => f.startsWith('sitemap-') && f.endsWith('.xml'));
  const urls = [];
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    const matches = content.matchAll(/<loc>([^<]+)<\/loc>/g);
    for (const m of matches) urls.push(m[1]);
  }
  return urls;
}

async function testUrl(url) {
  return new Promise((resolve) => {
    const curl = spawn('curl', ['-sL', '-o', '/dev/null', '-w', '%{http_code}', '--max-time', String(TIMEOUT), url]);
    let code = '';
    curl.stdout.on('data', d => code += d);
    curl.on('close', () => resolve({ url, status: parseInt(code) || 0 }));
    curl.on('error', () => resolve({ url, status: 0 }));
  });
}

async function run() {
  const urls = getUrls();
  console.log(`Testing ${urls.length} URLs with ${WORKERS} workers...\n`);
  
  const failed = [];
  let done = 0;
  const start = Date.now();
  
  // Process in batches
  for (let i = 0; i < urls.length; i += WORKERS) {
    const batch = urls.slice(i, i + WORKERS);
    const results = await Promise.all(batch.map(testUrl));
    
    for (const r of results) {
      done++;
      if (r.status !== 200) failed.push(r);
    }
    
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const rate = (done / elapsed).toFixed(0);
    process.stdout.write(`\r✓ ${done}/${urls.length} (${rate}/s) | Failed: ${failed.length}    `);
  }
  
  console.log(`\n\n=== COMPLETE ===`);
  console.log(`Total: ${urls.length}`);
  console.log(`Passed: ${urls.length - failed.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Time: ${((Date.now() - start) / 1000).toFixed(1)}s`);
  
  if (failed.length > 0) {
    console.log(`\nFailed URLs:`);
    failed.slice(0, 20).forEach(f => console.log(`  ${f.status}: ${f.url}`));
    fs.writeFileSync('sitemap-failures.json', JSON.stringify(failed, null, 2));
  }
}

run();
