const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const https = require('https');

function readSitemapIndex(indexPath) {
  const xml = fs.readFileSync(indexPath, 'utf8');
  const sitemapFiles = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]).filter(u => u.includes('sitemap'));
  // Map remote to local filenames in /public
  const local = sitemapFiles.map(u => path.join('public', path.basename(new URL(u).pathname)));
  return local;
}

function readUrls(file) {
  const xml = fs.readFileSync(file, 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
}

function head(url) {
  return new Promise(resolve => {
    const req = https.request(url, { method: 'HEAD', timeout: 15000 }, res => {
      resolve({ url, status: res.statusCode });
    });
    req.on('error', () => resolve({ url, status: 0 }));
    req.on('timeout', () => { req.destroy(); resolve({ url, status: 0 }); });
    req.end();
  });
}

async function run() {
  const index = path.join('public', 'sitemap.xml');
  const files = readSitemapIndex(index);
  const all = files.flatMap(readUrls);
  console.log(`Found ${all.length} URLs to test`);

  const concurrency = 50;
  let i = 0;
  const results = [];

  async function worker(id) {
    while (true) {
      const idx = i++;
      if (idx >= all.length) break;
      const u = all[idx];
      const r = await head(u);
      results[idx] = r;
      if (idx % 1000 === 0) console.log(`[${idx}/${all.length}] ${u} -> ${r.status}`);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, (_, k) => worker(k)));
  const fails = results.filter(r => !r || (r.status && r.status >= 400) || r.status === 0);
  fs.writeFileSync('sitemap-test-results.json', JSON.stringify({ total: all.length, fails }, null, 2));
  console.log(`Done. Failures: ${fails.length}. See sitemap-test-results.json`);
}

run().catch(e => { console.error(e); process.exit(1); });
