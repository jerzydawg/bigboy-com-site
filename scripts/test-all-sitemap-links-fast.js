/**
 * Ultra-Fast Sitemap Link Tester
 * Optimized for maximum speed - uses async exec for non-blocking
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const PARALLEL_WORKERS = 200;
const TIMEOUT_MS = 3000;

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

// Test URL using async curl (non-blocking)
async function testUrl(url) {
  try {
    const { stdout, stderr } = await Promise.race([
      execAsync(
        `curl -I -s -L -m 3 --max-time 3 --connect-timeout 2 "${url}" 2>&1`,
        { maxBuffer: 1024 * 256 }
      ),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), TIMEOUT_MS)
      )
    ]);
    
    const result = stdout || stderr || '';
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
      redirected = true;
    }
    
    return {
      url,
      status,
      ok: status === 200,
      redirected,
      finalUrl: redirected && finalUrl !== url ? finalUrl : null
    };
  } catch (error) {
    return {
      url,
      status: 'ERROR',
      ok: false,
      error: error.message.substring(0, 50),
      redirected: false,
      finalUrl: null
    };
  }
}

// Process URLs in parallel batches with progress updates
async function processBatch(urls, batchNumber, totalBatches, startTime) {
  // Process all URLs in parallel
  const results = await Promise.all(urls.map(url => testUrl(url)));
  
  const passed = results.filter(r => r.ok && r.status === 200).length;
  const failed = results.filter(r => !r.ok || r.status !== 200).length;
  const redirected = results.filter(r => r.redirected).length;
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const progress = ((batchNumber / totalBatches) * 100).toFixed(1);
  
  process.stdout.write(`\r📊 Batch ${batchNumber}/${totalBatches} (${progress}%) | ✅ ${passed} | ❌ ${failed} | 🔄 ${redirected} | ${elapsed}s`);
  
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
    if (urls.length > 0) {
      console.log(`✅ ${filename}: ${urls.length} URLs`);
    }
  }
  
  console.log(`\n📊 Total URLs to test: ${allUrls.length}`);
  console.log(`🚀 Starting ultra-fast tests with ${PARALLEL_WORKERS} parallel workers...\n`);
  
  // Split URLs into batches
  const batches = [];
  for (let i = 0; i < allUrls.length; i += PARALLEL_WORKERS) {
    batches.push(allUrls.slice(i, i + PARALLEL_WORKERS));
  }
  
  console.log(`📦 Created ${batches.length} batches (${PARALLEL_WORKERS} URLs per batch)\n`);
  
  const startTime = Date.now();
  let totalPassed = 0;
  let totalFailed = 0;
  let totalRedirected = 0;
  const failures = [];
  const redirects = [];
  const allResults = [];
  
  // Process batches sequentially (but URLs within each batch in parallel)
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const batchResult = await processBatch(batch, i + 1, batches.length, startTime);
    
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
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  const urlsPerSecond = (allUrls.length / parseFloat(duration)).toFixed(0);
  
  console.log('\n\n📊 Final Results:');
  console.log('═'.repeat(70));
  console.log(`Total URLs tested: ${allUrls.length}`);
  console.log(`✅ Passed (200 OK): ${totalPassed} (${((totalPassed / allUrls.length) * 100).toFixed(2)}%)`);
  console.log(`❌ Failed: ${totalFailed} (${((totalFailed / allUrls.length) * 100).toFixed(2)}%)`);
  console.log(`🔄 Redirected: ${totalRedirected} (${((totalRedirected / allUrls.length) * 100).toFixed(2)}%)`);
  console.log(`⏱️  Duration: ${duration}s (${urlsPerSecond} URLs/sec)`);
  console.log('═'.repeat(70));
  
  // Status code breakdown
  const statusCodes = {};
  allResults.forEach(r => {
    const code = r.status;
    statusCodes[code] = (statusCodes[code] || 0) + 1;
  });
  
  console.log('\n📈 Status Code Breakdown:');
  Object.entries(statusCodes)
    .sort((a, b) => {
      const aNum = typeof a[0] === 'number' ? a[0] : 999;
      const bNum = typeof b[0] === 'number' ? b[0] : 999;
      return aNum - bNum;
    })
    .forEach(([code, count]) => {
      console.log(`   ${code}: ${count} URLs`);
    });
  
  // Show failures
  if (failures.length > 0) {
    console.log(`\n❌ Failed URLs (showing first 50):`);
    failures.slice(0, 50).forEach(f => {
      console.log(`   ${f.url}`);
      console.log(`      Status: ${f.status}${f.error ? ` - ${f.error}` : ''}`);
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
  
  // Check for www redirects
  const wwwRedirects = allResults.filter(r => r.finalUrl && r.finalUrl.includes('www.'));
  if (wwwRedirects.length > 0) {
    console.log(`\n⚠️  WARNING: ${wwwRedirects.length} URLs redirecting to www`);
  }
  
  // Summary
  console.log('\n' + '═'.repeat(70));
  if (totalFailed === 0) {
    console.log('✅ SUCCESS: All URLs are accessible!');
  } else {
    console.log(`⚠️  WARNING: ${totalFailed} URLs failed. Review the failures above.`);
  }
  console.log('═'.repeat(70));
  
  return {
    total: allUrls.length,
    passed: totalPassed,
    failed: totalFailed,
    redirected: totalRedirected,
    duration,
    urlsPerSecond,
    failures
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
