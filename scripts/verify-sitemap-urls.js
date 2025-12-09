/**
 * Verify Sitemap URLs
 * Tests a sample of URLs from sitemaps to ensure they're accessible
 */

import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://government-phone.co';
const SAMPLES_PER_SITEMAP = 10;

// Simple XML parser to extract URLs
function extractUrlsFromSitemap(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const urls = [];
  const urlMatches = content.matchAll(/<loc>(.*?)<\/loc>/g);
  
  for (const match of urlMatches) {
    urls.push(match[1]);
  }
  
  return urls;
}

// Test URL accessibility
async function testUrl(url) {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(5000)
    });
    return {
      url,
      status: response.status,
      ok: response.ok,
      redirected: response.redirected,
      finalUrl: response.url
    };
  } catch (error) {
    return {
      url,
      status: 'ERROR',
      error: error.message,
      ok: false
    };
  }
}

async function verifySitemaps() {
  const sitemapFiles = [
    'sitemap-main.xml',
    'sitemap-1.xml',
    'sitemap-2.xml',
    'sitemap-3.xml',
    'sitemap-4.xml',
    'sitemap-5.xml'
  ];

  console.log('🔍 Verifying sitemap URLs...\n');
  
  let totalTested = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  const failures = [];

  for (const filename of sitemapFiles) {
    const filePath = path.join('public', filename);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ${filename} not found, skipping...`);
      continue;
    }

    console.log(`📄 Testing ${filename}...`);
    const urls = extractUrlsFromSitemap(filePath);
    
    if (urls.length === 0) {
      console.log(`   ⚠️  No URLs found in ${filename}`);
      continue;
    }

    // Test a sample of URLs
    const sampleSize = Math.min(SAMPLES_PER_SITEMAP, urls.length);
    const sampleUrls = urls.slice(0, sampleSize);
    
    console.log(`   Testing ${sampleSize} sample URLs (out of ${urls.length} total)...`);
    
    for (const url of sampleUrls) {
      totalTested++;
      const result = await testUrl(url);
      
      if (result.ok && result.status === 200) {
        totalPassed++;
        process.stdout.write('.');
      } else {
        totalFailed++;
        failures.push(result);
        process.stdout.write('F');
      }
    }
    
    console.log(`\n   ✅ ${filename}: ${sampleSize} URLs tested`);
  }

  console.log('\n📊 Summary:');
  console.log(`   Total URLs tested: ${totalTested}`);
  console.log(`   ✅ Passed: ${totalPassed}`);
  console.log(`   ❌ Failed: ${totalFailed}`);
  
  if (failures.length > 0) {
    console.log('\n❌ Failed URLs:');
    failures.forEach(f => {
      console.log(`   ${f.url} - Status: ${f.status}${f.error ? ` - Error: ${f.error}` : ''}`);
    });
  }
  
  if (totalFailed === 0) {
    console.log('\n✅ All tested URLs are accessible!');
  } else {
    console.log(`\n⚠️  ${totalFailed} URLs failed. Review the list above.`);
  }
}

// Run verification
verifySitemaps().catch(console.error);

