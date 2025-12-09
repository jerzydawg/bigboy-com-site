/**
 * Optimized Sitemap Link Tester
 * - 100 parallel workers
 * - Retries failed URLs to confirm
 * - Live progress bar
 * - Detailed failure reasons
 * - Optimized for Mac
 */

import fs from 'fs';
import path from 'path';

const PARALLEL_WORKERS = 100;
const TIMEOUT_MS = 8000;
const RETRY_COUNT = 2;

// Extract URLs from sitemap
function extractUrlsFromSitemap(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const urls = [];
  const matches = content.matchAll(/<loc>(.*?)<\/loc>/g);
  for (const match of matches) urls.push(match[1]);
  return urls;
}

// Test single URL
async function testUrl(url) {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) SitemapChecker/1.0' }
    });
    
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    return {
      url,
      status: response.status,
      ok: response.status === 200,
      duration,
      finalUrl: response.url !== url ? response.url : null,
      reason: response.status === 200 ? null : `HTTP ${response.status}`
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    let reason = 'Unknown error';
    if (error.name === 'AbortError') reason = 'Timeout (8s)';
    else if (error.code === 'ECONNREFUSED') reason = 'Connection refused';
    else if (error.code === 'ENOTFOUND') reason = 'DNS not found';
    else if (error.message) reason = error.message.substring(0, 50);
    
    return { url, status: 'ERROR', ok: false, duration, finalUrl: null, reason };
  }
}

// Progress bar
function drawProgressBar(current, total, passed, failed, speed, eta) {
  const width = 30;
  const percent = current / total;
  const filled = Math.round(width * percent);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const percentStr = (percent * 100).toFixed(1).padStart(5);
  
  process.stdout.write(`\r[${bar}] ${percentStr}% | ${current}/${total} | ✅ ${passed} ❌ ${failed} | ${speed}/s | ETA: ${eta}s   `);
}

// Process batch
async function processBatch(urls) {
  return Promise.all(urls.map(url => testUrl(url)));
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     OPTIMIZED SITEMAP LINK TESTER (100 workers)              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  // Load URLs
  console.log('📂 Loading sitemaps...');
  const sitemapFiles = ['sitemap-main.xml', 'sitemap-2.xml', 'sitemap-3.xml', 'sitemap-4.xml', 'sitemap-5.xml'];
  let allUrls = [];
  
  for (const file of sitemapFiles) {
    const filePath = path.join('public', file);
    const urls = extractUrlsFromSitemap(filePath);
    if (urls.length > 0) {
      console.log(`   ✓ ${file}: ${urls.length.toLocaleString()} URLs`);
      allUrls = allUrls.concat(urls);
    }
  }
  
  console.log(`\n📊 Total URLs: ${allUrls.length.toLocaleString()}`);
  console.log(`🔧 Workers: ${PARALLEL_WORKERS} | Timeout: ${TIMEOUT_MS/1000}s | Retries: ${RETRY_COUNT}\n`);
  
  // Split into batches
  const batches = [];
  for (let i = 0; i < allUrls.length; i += PARALLEL_WORKERS) {
    batches.push(allUrls.slice(i, i + PARALLEL_WORKERS));
  }
  
  console.log('🚀 Starting test...\n');
  
  const startTime = Date.now();
  let totalPassed = 0;
  let totalFailed = 0;
  let processed = 0;
  let failures = [];
  
  // Process batches
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const results = await processBatch(batch);
    
    for (const result of results) {
      processed++;
      if (result.ok) {
        totalPassed++;
      } else {
        totalFailed++;
        failures.push(result);
      }
    }
    
    // Update progress
    const elapsed = (Date.now() - startTime) / 1000;
    const speed = Math.round(processed / elapsed);
    const remaining = allUrls.length - processed;
    const eta = speed > 0 ? Math.round(remaining / speed) : 0;
    
    drawProgressBar(processed, allUrls.length, totalPassed, totalFailed, speed, eta);
    
    // Small delay to prevent overwhelming
    if (i < batches.length - 1) {
      await new Promise(r => setTimeout(r, 50));
    }
  }
  
  console.log('\n');
  
  // Retry failed URLs
  let confirmedFailures = [];
  if (failures.length > 0) {
    console.log(`\n🔄 Retrying ${failures.length} failed URLs (${RETRY_COUNT} attempts each)...\n`);
    
    let retryPassed = 0;
    let urlsToRetry = [...failures];
    
    for (let attempt = 1; attempt <= RETRY_COUNT; attempt++) {
      if (urlsToRetry.length === 0) break;
      
      console.log(`   Attempt ${attempt}/${RETRY_COUNT}: Testing ${urlsToRetry.length} URLs...`);
      
      const stillFailing = [];
      
      // Process retries in smaller batches
      for (let i = 0; i < urlsToRetry.length; i += 20) {
        const batch = urlsToRetry.slice(i, i + 20);
        const results = await Promise.all(batch.map(f => testUrl(f.url)));
        
        for (const result of results) {
          if (result.ok) {
            retryPassed++;
          } else {
            stillFailing.push(result);
          }
        }
        
        await new Promise(r => setTimeout(r, 100));
      }
      
      urlsToRetry = stillFailing;
    }
    
    confirmedFailures = urlsToRetry;
    totalPassed += retryPassed;
    totalFailed = confirmedFailures.length;
    
    console.log(`   ✓ Recovered ${retryPassed} URLs on retry\n`);
  }
  
  // Final results
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  const avgSpeed = Math.round(allUrls.length / parseFloat(totalTime));
  
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                      FINAL RESULTS                           ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Total URLs tested:  ${allUrls.length.toLocaleString().padStart(10)}                            ║`);
  console.log(`║  ✅ Passed:          ${totalPassed.toLocaleString().padStart(10)} (${((totalPassed/allUrls.length)*100).toFixed(2)}%)                    ║`);
  console.log(`║  ❌ Failed:          ${totalFailed.toLocaleString().padStart(10)} (${((totalFailed/allUrls.length)*100).toFixed(2)}%)                     ║`);
  console.log(`║  ⏱️  Duration:        ${totalTime.padStart(10)}s                            ║`);
  console.log(`║  🚀 Speed:           ${avgSpeed.toString().padStart(10)} URLs/sec                    ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  // Show failures with reasons
  if (confirmedFailures.length > 0) {
    console.log('\n❌ CONFIRMED FAILURES (after retries):\n');
    
    // Group by reason
    const byReason = {};
    confirmedFailures.forEach(f => {
      const reason = f.reason || 'Unknown';
      if (!byReason[reason]) byReason[reason] = [];
      byReason[reason].push(f);
    });
    
    console.log('📊 Failures by reason:');
    Object.entries(byReason).forEach(([reason, items]) => {
      console.log(`   ${reason}: ${items.length} URLs`);
    });
    
    console.log('\n📋 Failed URLs:\n');
    confirmedFailures.forEach((f, i) => {
      const urlPath = f.url.replace('https://government-phone.co', '');
      console.log(`${(i+1).toString().padStart(3)}. ${urlPath}`);
      console.log(`     Status: ${f.status} | Reason: ${f.reason || 'Unknown'}`);
    });
    
    // Save to file
    fs.writeFileSync('sitemap-test-failures.json', JSON.stringify(confirmedFailures.map(f => ({
      url: f.url,
      status: f.status,
      reason: f.reason,
      finalUrl: f.finalUrl
    })), null, 2));
    
    console.log(`\n💾 Failures saved to: sitemap-test-failures.json`);
  } else {
    console.log('\n🎉 ALL URLS PASSED! No failures detected.');
  }
  
  // Summary
  console.log('\n' + (confirmedFailures.length === 0 ? '🎉 SUCCESS! All URLs working.' : `⚠️  ${confirmedFailures.length} URLs need attention.`));
  
  return { total: allUrls.length, passed: totalPassed, failed: confirmedFailures.length };
}

main()
  .then(r => process.exit(r.failed > 0 ? 1 : 0))
  .catch(e => { console.error('Fatal:', e); process.exit(1); });
