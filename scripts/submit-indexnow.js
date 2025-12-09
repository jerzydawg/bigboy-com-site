import fs from 'fs';
import path from 'path';

const KEY = 'b8f4c2a1e9d7f3b5a6c8e0d2f1a4b7c9';
const HOST = 'government-phone.co';

// Get URLs from sitemaps
const dir = './public';
const files = fs.readdirSync(dir).filter(f => f.startsWith('sitemap-') && f.endsWith('.xml'));
const urls = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const matches = content.matchAll(/<loc>([^<]+)<\/loc>/g);
  for (const m of matches) urls.push(m[1]);
}

console.log(`Submitting ${urls.length} URLs to IndexNow...\n`);

// Submit in batches of 10000
const batches = [];
for (let i = 0; i < urls.length; i += 10000) {
  batches.push(urls.slice(i, i + 10000));
}

async function submit() {
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const body = JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/indexnow-key.txt`,
      urlList: batch
    });

    try {
      const res = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      console.log(`Batch ${i + 1}/${batches.length}: ${res.status} ${res.statusText}`);
    } catch (e) {
      console.log(`Batch ${i + 1} error:`, e.message);
    }
  }
}

submit();
