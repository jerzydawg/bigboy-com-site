/**
 * Live Status Sitemap Link Tester
 * Shows real-time progress
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const PARALLEL_WORKERS = 50;
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
    
    let status = 'UNKNOWN';
    
    if (statusLine) {
      const match = statusLine.match(/HTTP\/[\d.]+\s+(\d+)/);
      if (match) {
        status = parseInt(match[1]);
      }
    }
    
    return {
      url,
      status,
      ok: status === 200
    };
  } catch (error) {
    return {
      url,
      status: 'ERROR',
      ok: false
    };
  }
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
  console.log(`🚀 Starting tests with ${PARALLEL_WORKERS} parallel workers...\n`);
  
  // Split URLs into batches
  const batches = [];
  for (let i = 0; i < allUrls.length; i += PARALLEL_WORKERS) {
    batches.push(allUrls.slice(i, i + PARALLEL_WORKERS));
  }
  
  console.log(`📦 Created ${batches.length} batches\n`);
  console.log('═'.repeat(80));
  console.log('LIVE STATUS:');
  console.log('═'.repeat(80));
  
  const startTime = Date.now();
  let totalPassed = 0;
  let totalFailed = 0;
  let processed = 0;
  const failures = [];
  
  // Process batches with live updates
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    
    // Process batch
    const results = await Promise.all(batch.map(url => testUrl(url)));
    
    const passed = results.filter(r => r.ok).length;
    const failed = results.filter(r => !r.ok).length;
    
    totalPassed += passed;
    totalFailed += failed;
    processed += batch.length;
    
    // Collect failures
    results.forEach(r => {
      if (!r.ok) failures.push(r);
    });
    
    // Live status update
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const progress = ((processed / allUrls.length) * 100).toFixed(1);
    const rate = (processed / parseFloat(elapsed)).toFixed(0);
    const remaining = ((allUrls.length - processed) / parseFloat(rate)).toFixed(0);
    
    // Clear line and write status
    process.stdout.write(`\r📊 Progress: ${progress}% | Processed: ${processed}/${allUrls.length} | ✅ ${totalPassed} | ❌ ${totalFailed} | Speed: ${rate}/s | ETA: ${remaining}s`);
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  const urlsPerSecond = (allUrls.length / parseFloat(duration)).toFixed(0);
  
  console.log('\n\n' + '═'.repeat(80));
  console.log('📊 FINAL RESULTS:');
  console.log('═'.repeat(80));
  console.log(`Total URLs tested: ${allUrls.length}`);
  console.log(`✅ Passed (200 OK): ${totalPassed} (${((totalPassed / allUrls.length) * 100).toFixed(2)}%)`);
  console.log(`❌ Failed: ${totalFailed} (${((totalFailed / allUrls.length) * 100).toFixed(2)}%)`);
  console.log(`⏱️  Duration: ${duration}s`);
  console.log(`🚀 Speed: ${urlsPerSecond} URLs/sec`);
  console.log('═'.repeat(80));
  
  if (failures.length > 0) {
    console.log(`\n❌ Failed URLs (first 20):`);
    failures.slice(0, 20).forEach(f => {
      console.log(`   ${f.url} - ${f.status}`);
    });
    
    if (failures.length > 20) {
      console.log(`   ... and ${failures.length - 20} more`);
    }
    
    fs.writeFileSync(
      'sitemap-test-failures.json',
      JSON.stringify(failures, null, 2)
    );
    console.log(`\n💾 All failures saved to: sitemap-test-failures.json`);
  }
  
  if (totalFailed === 0) {
    console.log('\n✅ SUCCESS: All URLs are accessible!');
  } else {
    console.log(`\n⚠️  WARNING: ${totalFailed} URLs failed.`);
  }
  
  return {
    total: allUrls.length,
    passed: totalPassed,
    failed: totalFailed,
    duration,
    urlsPerSecond
  };
}

// Run the tests
testAllSitemapLinks()
  .then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

