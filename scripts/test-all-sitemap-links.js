/**
 * Test All Sitemap Links with 200 Parallel Workers
 * Verifies all URLs in sitemaps are accessible
 */

import fs from 'fs';
import path from 'path';

const PARALLEL_WORKERS = 100;
const TIMEOUT_MS = 10000; // 10 second timeout per URL
const BASE_URL = 'https://government-phone.co';

// Extract all URLs from sitemap files
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

// Test URL accessibility with timeout
async function testUrl(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      
      const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SitemapValidator/1.0)'
        }
      });
      
      clearTimeout(timeoutId);
      
      return {
        url,
        status: response.status,
        ok: response.ok,
        redirected: response.redirected,
        finalUrl: response.url !== url ? response.url : null,
        contentType: response.headers.get('content-type'),
        error: null
      };
    } catch (error) {
      if (attempt === retries) {
        return {
          url,
          status: 'ERROR',
          ok: false,
          error: error.message,
          redirected: false,
          finalUrl: null,
          contentType: null
        };
      }
      // Retry after short delay
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

// Process URLs in parallel batches
async function processBatch(urls, batchNumber, totalBatches) {
  const results = await Promise.all(urls.map(url => testUrl(url)));
  
  const passed = results.filter(r => r.ok && r.status === 200).length;
  const failed = results.filter(r => !r.ok || r.status !== 200).length;
  const redirected = results.filter(r => r.redirected).length;
  
  process.stdout.write(`\r📊 Batch ${batchNumber}/${totalBatches}: Testing ${urls.length} URLs... (✅ ${passed} passed, ❌ ${failed} failed, 🔄 ${redirected} redirected)`);
  
  return {
    results,
    passed,
    failed,
    redirected
  };
}

async function testAllSitemapLinks() {
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
    const filePath = path.join('public', filename);
    const urls = extractUrlsFromSitemap(filePath);
    allUrls = allUrls.concat(urls);
    console.log(`✅ ${filename}: ${urls.length} URLs`);
  }
  
  console.log(`\n📊 Total URLs to test: ${allUrls.length}\n`);
  console.log(`🚀 Starting tests with ${PARALLEL_WORKERS} parallel workers...\n`);
  
  // Split URLs into batches
  const batches = [];
  for (let i = 0; i < allUrls.length; i += PARALLEL_WORKERS) {
    batches.push(allUrls.slice(i, i + PARALLEL_WORKERS));
  }
  
  console.log(`📦 Created ${batches.length} batches\n`);
  
  let totalPassed = 0;
  let totalFailed = 0;
  let totalRedirected = 0;
  const failures = [];
  const redirects = [];
  const allResults = [];
  
  // Process batches sequentially (but URLs within each batch in parallel)
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const batchResult = await processBatch(batch, i + 1, batches.length);
    
    totalPassed += batchResult.passed;
    totalFailed += batchResult.failed;
    totalRedirected += batchResult.redirected;
    
    batchResult.results.forEach(result => {
      allResults.push(result);
      if (!result.ok || result.status !== 200) {
        failures.push(result);
      }
      if (result.redirected) {
        redirects.push(result);
      }
    });
    
    // Small delay between batches to avoid overwhelming the server
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log('\n\n📊 Final Results:');
  console.log('═'.repeat(60));
  console.log(`Total URLs tested: ${allUrls.length}`);
  console.log(`✅ Passed (200 OK): ${totalPassed} (${((totalPassed / allUrls.length) * 100).toFixed(2)}%)`);
  console.log(`❌ Failed: ${totalFailed} (${((totalFailed / allUrls.length) * 100).toFixed(2)}%)`);
  console.log(`🔄 Redirected: ${totalRedirected} (${((totalRedirected / allUrls.length) * 100).toFixed(2)}%)`);
  console.log('═'.repeat(60));
  
  // Status code breakdown
  const statusCodes = {};
  allResults.forEach(r => {
    const code = r.status;
    statusCodes[code] = (statusCodes[code] || 0) + 1;
  });
  
  console.log('\n📈 Status Code Breakdown:');
  Object.entries(statusCodes)
    .sort((a, b) => b[1] - a[1])
    .forEach(([code, count]) => {
      console.log(`   ${code}: ${count} URLs`);
    });
  
  // Show failures
  if (failures.length > 0) {
    console.log(`\n❌ Failed URLs (showing first 50):`);
    failures.slice(0, 50).forEach(f => {
      console.log(`   ${f.url}`);
      console.log(`      Status: ${f.status}${f.error ? ` - Error: ${f.error}` : ''}`);
      if (f.finalUrl) {
        console.log(`      Redirected to: ${f.finalUrl}`);
      }
    });
    
    if (failures.length > 50) {
      console.log(`   ... and ${failures.length - 50} more failures`);
    }
    
    // Save all failures to file
    fs.writeFileSync(
      'sitemap-test-failures.json',
      JSON.stringify(failures, null, 2)
    );
    console.log(`\n💾 All ${failures.length} failures saved to: sitemap-test-failures.json`);
  }
  
  // Show redirects (if any)
  if (redirects.length > 0 && redirects.length < 100) {
    console.log(`\n🔄 Redirected URLs:`);
    redirects.forEach(r => {
      console.log(`   ${r.url} → ${r.finalUrl}`);
    });
  }
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  if (totalFailed === 0) {
    console.log('✅ SUCCESS: All URLs are accessible!');
  } else {
    console.log(`⚠️  WARNING: ${totalFailed} URLs failed. Review the failures above.`);
  }
  console.log('═'.repeat(60));
  
  return {
    total: allUrls.length,
    passed: totalPassed,
    failed: totalFailed,
    redirected: totalRedirected,
    failures,
    redirects
  };
}

// Run the tests
testAllSitemapLinks()
  .then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

