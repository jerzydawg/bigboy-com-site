/**
 * Test Sample of Sitemap Links (Quick Test)
 * Tests a sample of URLs to verify they work
 */

import fs from 'fs';

const SAMPLE_SIZE = 100; // Test 100 URLs first
const TIMEOUT_MS = 10000;

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

async function testUrl(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    // Follow redirects and test the final URL
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SitemapValidator/1.0)'
      }
    });
    
    clearTimeout(timeoutId);
    
    const finalUrl = response.url;
    const wasRedirected = finalUrl !== url;
    
    return {
      url,
      status: response.status,
      ok: response.ok && response.status === 200,
      redirected: wasRedirected,
      finalUrl: wasRedirected ? finalUrl : null
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
  
  console.log(`🧪 Testing sample of ${sample.length} URLs...\n`);
  
  const results = await Promise.all(sample.map(url => testUrl(url)));
  
  const passed = results.filter(r => r.ok && r.status === 200).length;
  const failed = results.filter(r => !r.ok || r.status !== 200).length;
  const redirected = results.filter(r => r.redirected).length;
  
  console.log('\n📊 Results:');
  console.log('═'.repeat(60));
  console.log(`✅ Passed (200 OK): ${passed} (${((passed / sample.length) * 100).toFixed(2)}%)`);
  console.log(`❌ Failed: ${failed} (${((failed / sample.length) * 100).toFixed(2)}%)`);
  console.log(`🔄 Redirected: ${redirected} (${((redirected / sample.length) * 100).toFixed(2)}%)`);
  console.log('═'.repeat(60));
  
  // Show failures
  const failures = results.filter(r => !r.ok || r.status !== 200);
  if (failures.length > 0) {
    console.log(`\n❌ Failed URLs (first 20):`);
    failures.slice(0, 20).forEach(f => {
      console.log(`   ${f.url}`);
      console.log(`      Status: ${f.status}${f.error ? ` - ${f.error}` : ''}`);
      if (f.finalUrl) {
        console.log(`      Redirected to: ${f.finalUrl}`);
      }
    });
  }
  
  // Show redirects
  const redirects = results.filter(r => r.redirected);
  if (redirects.length > 0 && redirects.length < 20) {
    console.log(`\n🔄 Redirected URLs:`);
    redirects.forEach(r => {
      console.log(`   ${r.url} → ${r.finalUrl}`);
    });
  }
  
  // Check for www redirects
  const wwwRedirects = results.filter(r => r.finalUrl && r.finalUrl.includes('www.'));
  if (wwwRedirects.length > 0) {
    console.log(`\n⚠️  WARNING: ${wwwRedirects.length} URLs redirecting to www:`);
    wwwRedirects.slice(0, 10).forEach(r => {
      console.log(`   ${r.url} → ${r.finalUrl}`);
    });
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
      console.log('\n⚠️  Some URLs are still redirecting to www. Check Vercel domain settings.');
    }
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

