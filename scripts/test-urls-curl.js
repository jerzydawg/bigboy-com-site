/**
 * Test URLs using curl (more reliable than fetch)
 */

import { execSync } from 'child_process';
import fs from 'fs';

const SAMPLE_SIZE = 100;

function extractUrlsFromSitemap(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const urls = [];
  const urlMatches = content.matchAll(/<loc>(.*?)<\/loc>/g);
  
  for (const match of urlMatches) {
    urls.push(match[1]);
  }
  
  return urls;
}

function testUrlWithCurl(url) {
  try {
    const result = execSync(
      `curl -I -s -L -m 10 "${url}" 2>&1`,
      { encoding: 'utf-8', maxBuffer: 1024 * 1024 }
    );
    
    const lines = result.split('\n');
    const statusLine = lines.find(l => l.startsWith('HTTP/'));
    const locationLine = lines.find(l => l.toLowerCase().startsWith('location:'));
    
    let status = 'UNKNOWN';
    let finalUrl = url;
    let redirected = false;
    
    if (statusLine) {
      const match = statusLine.match(/HTTP\/[\d.]+\s+(\d+)/);
      if (match) {
        status = parseInt(match[1]);
      }
    }
    
    if (locationLine) {
      finalUrl = locationLine.split(':').slice(1).join(':').trim();
      redirected = true;
    } else if (status >= 300 && status < 400) {
      // Check if redirected via status code
      redirected = true;
    }
    
    return {
      url,
      status,
      ok: status === 200,
      redirected,
      finalUrl: redirected ? finalUrl : null
    };
  } catch (error) {
    return {
      url,
      status: 'ERROR',
      ok: false,
      error: error.message,
      redirected: false,
      finalUrl: null
    };
  }
}

async function testSample() {
  console.log('🔍 Extracting URLs from sitemaps...\n');
  
  const sitemapFiles = [
    'sitemap-main.xml',
    'sitemap-1.xml',
    'sitemap-2.xml',
    'sitemap-3.xml',
    'sitemap-4.xml',
    'sitemap-5.xml'
  ];

  let allUrls = [];
  
  for (const filename of sitemapFiles) {
    const filePath = `public/${filename}`;
    const urls = extractUrlsFromSitemap(filePath);
    allUrls = allUrls.concat(urls);
  }
  
  console.log(`📊 Total URLs in sitemaps: ${allUrls.length}`);
  
  // Get sample
  const sample = [];
  const step = Math.floor(allUrls.length / SAMPLE_SIZE);
  for (let i = 0; i < allUrls.length && sample.length < SAMPLE_SIZE; i += step) {
    sample.push(allUrls[i]);
  }
  
  console.log(`🧪 Testing sample of ${sample.length} URLs with curl...\n`);
  
  const results = [];
  for (let i = 0; i < sample.length; i++) {
    const url = sample[i];
    process.stdout.write(`\r   Testing ${i + 1}/${sample.length}: ${url.substring(0, 60)}...`);
    const result = testUrlWithCurl(url);
    results.push(result);
  }
  
  console.log('\n');
  
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  const redirected = results.filter(r => r.redirected).length;
  
  console.log('\n📊 Results:');
  console.log('═'.repeat(60));
  console.log(`✅ Passed (200 OK): ${passed} (${((passed / sample.length) * 100).toFixed(2)}%)`);
  console.log(`❌ Failed: ${failed} (${((failed / sample.length) * 100).toFixed(2)}%)`);
  console.log(`🔄 Redirected: ${redirected} (${((redirected / sample.length) * 100).toFixed(2)}%)`);
  console.log('═'.repeat(60));
  
  // Status code breakdown
  const statusCodes = {};
  results.forEach(r => {
    const code = r.status;
    statusCodes[code] = (statusCodes[code] || 0) + 1;
  });
  
  console.log('\n📈 Status Code Breakdown:');
  Object.entries(statusCodes)
    .sort((a, b) => (typeof a[0] === 'number' ? a[0] : 999) - (typeof b[0] === 'number' ? b[0] : 999))
    .forEach(([code, count]) => {
      console.log(`   ${code}: ${count} URLs`);
    });
  
  // Show failures
  const failures = results.filter(r => !r.ok);
  if (failures.length > 0) {
    console.log(`\n❌ Failed URLs (first 20):`);
    failures.slice(0, 20).forEach(f => {
      console.log(`   ${f.url}`);
      console.log(`      Status: ${f.status}${f.error ? ` - ${f.error}` : ''}`);
      if (f.finalUrl && f.finalUrl !== f.url) {
        console.log(`      Redirected to: ${f.finalUrl}`);
      }
    });
  }
  
  // Check for www redirects
  const wwwRedirects = results.filter(r => r.finalUrl && r.finalUrl.includes('www.'));
  if (wwwRedirects.length > 0) {
    console.log(`\n⚠️  WARNING: ${wwwRedirects.length} URLs redirecting to www:`);
    wwwRedirects.slice(0, 10).forEach(r => {
      console.log(`   ${r.url} → ${r.finalUrl}`);
    });
    console.log(`\n💡 Fix: Configure Vercel domain settings to make non-www primary`);
  }
  
  return {
    total: sample.length,
    passed,
    failed,
    redirected,
    wwwRedirects: wwwRedirects.length
  };
}

testSample()
  .then(results => {
    if (results.wwwRedirects > 0) {
      console.log('\n⚠️  Domain redirect issue detected. Configure Vercel domains.');
    }
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });


