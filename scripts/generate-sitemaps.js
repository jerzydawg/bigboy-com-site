import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Initialize Supabase client
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const MAX_URLS_PER_SITEMAP = 10000;
const BASE_URL = 'https://government-phone.co';
// Use current date for lastmod
const LAST_MOD = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
const BATCH_SIZE = 1000; // Supabase default limit

// Helper function to create city slug (matches slug-utils.js)
function createCitySlug(cityName) {
  if (!cityName) return '';
  
  return cityName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[''′]/g, '') // Remove various apostrophe types
    .replace(/[""″]/g, '') // Remove various quote types
    .replace(/[–—]/g, '-') // Convert various dashes to hyphens
    .replace(/[^\w\s-]/g, '') // Remove all non-word chars except spaces and hyphens
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Main pages (static) – use path-based URLs
const mainPages = [
  { url: `${BASE_URL}/`, priority: '1.0', changefreq: 'weekly' },
  { url: `${BASE_URL}/faq/`, priority: '0.8', changefreq: 'monthly' },
  { url: `${BASE_URL}/programs/`, priority: '0.8', changefreq: 'monthly' },
  { url: `${BASE_URL}/eligibility/`, priority: '0.8', changefreq: 'monthly' },
  { url: `${BASE_URL}/contact/`, priority: '0.7', changefreq: 'monthly' },
  { url: `${BASE_URL}/providers/`, priority: '0.8', changefreq: 'monthly' },
  { url: `${BASE_URL}/lifeline-program/`, priority: '0.8', changefreq: 'monthly' },
  { url: `${BASE_URL}/acp-program/`, priority: '0.8', changefreq: 'monthly' },
  { url: `${BASE_URL}/tribal-programs/`, priority: '0.7', changefreq: 'monthly' },
  { url: `${BASE_URL}/state-programs/`, priority: '0.7', changefreq: 'monthly' },
  { url: `${BASE_URL}/emergency-broadband/`, priority: '0.7', changefreq: 'monthly' },
  { url: `${BASE_URL}/free-government-phone-near-me/`, priority: '0.7', changefreq: 'monthly' },
  { url: `${BASE_URL}/apply/`, priority: '0.9', changefreq: 'monthly' }
];

function generateSitemapXML(urls) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  urls.forEach(({ url, priority, changefreq }) => {
    xml += '  <url>\n';
    xml += `    <loc>${url}</loc>\n`;
    xml += `    <lastmod>${LAST_MOD}</lastmod>\n`;
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
    xml += `    <priority>${priority}</priority>\n`;
    xml += '  </url>\n';
  });
  
  xml += '</urlset>';
  return xml;
}

function generateSitemapIndex(sitemapFiles) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  sitemapFiles.forEach(filename => {
    xml += '  <sitemap>\n';
    xml += `    <loc>${BASE_URL}/${filename}</loc>\n`;
    xml += `    <lastmod>${LAST_MOD}</lastmod>\n`;
    xml += '  </sitemap>\n';
  });
  
  xml += '</sitemapindex>';
  return xml;
}

async function fetchAllCities() {
  let allCities = [];
  let offset = 0;
  let hasMore = true;
  
  console.log('🔍 Fetching all cities with pagination...');
  
  while (hasMore) {
    const { data: cities, error, count } = await supabase
      .from('cities')
      .select('*', { count: 'exact' })
      .order('name')
      .range(offset, offset + BATCH_SIZE - 1);
    
    if (error) {
      console.error('❌ Error fetching cities:', error);
      break;
    }
    
    if (cities && cities.length > 0) {
      allCities = allCities.concat(cities);
      console.log(`✅ Fetched batch ${Math.floor(offset / BATCH_SIZE) + 1}: ${cities.length} cities (Total: ${allCities.length})`);
      offset += BATCH_SIZE;
    } else {
      hasMore = false;
    }
    
    // Safety check to prevent infinite loops
    if (offset > 100000) {
      console.log('⚠️  Safety limit reached, stopping pagination');
      break;
    }
  }
  
  return allCities;
}

async function generateSitemaps() {
  try {
    console.log('🔍 Fetching data from Supabase...');
    
    // Fetch all states
    const { data: states, error: statesError } = await supabase
      .from('states')
      .select('*')
      .order('name');
    
    if (statesError) {
      console.error('❌ Error fetching states:', statesError);
      return;
    }
    
    console.log(`✅ Found ${states.length} states`);
    
    // Fetch all cities with pagination
    const cities = await fetchAllCities();
    console.log(`✅ Found ${cities.length} cities total`);
    
    // Create state URLs as paths (e.g., https://government-phone.co/tx/)
    const stateUrls = states.map(state => ({
      url: `${BASE_URL}/${state.abbreviation.toLowerCase()}/`,
      priority: '0.8',
      changefreq: 'weekly'
    }));
    
    // Create city URLs as paths (e.g., https://government-phone.co/tx/houston/)
    const cityUrls = cities.map(city => {
      const state = states.find(s => s.id === city.state_id);
      if (!state) return null;
      
      const stateSlug = state.abbreviation.toLowerCase();
      const citySlug = createCitySlug(city.name);
      const pathUrl = `${BASE_URL}/${stateSlug}/${citySlug}/`;
      return { url: pathUrl, priority: '0.8', changefreq: 'weekly' };
    }).filter(Boolean);
    
    console.log(`✅ Generated ${stateUrls.length} state URLs and ${cityUrls.length} city URLs`);
    
    // Combine all URLs
    const allUrls = [...mainPages, ...stateUrls, ...cityUrls];
    console.log(`✅ Total URLs before deduplication: ${allUrls.length}`);
    
    // Remove duplicates based on URL
    const urlSet = new Set();
    const uniqueUrls = [];
    let duplicateCount = 0;
    
    for (const urlObj of allUrls) {
      if (!urlSet.has(urlObj.url)) {
        urlSet.add(urlObj.url);
        uniqueUrls.push(urlObj);
      } else {
        duplicateCount++;
        console.log(`⚠️  Duplicate URL found: ${urlObj.url}`);
      }
    }
    
    if (duplicateCount > 0) {
      console.log(`⚠️  Removed ${duplicateCount} duplicate URLs`);
    }
    
    console.log(`✅ Total unique URLs: ${uniqueUrls.length}`);
    
    // Split into chunks
    const chunks = [];
    for (let i = 0; i < uniqueUrls.length; i += MAX_URLS_PER_SITEMAP) {
      chunks.push(uniqueUrls.slice(i, i + MAX_URLS_PER_SITEMAP));
    }
    
    console.log(`📁 Creating ${chunks.length} sitemap files...`);
    
    // Generate individual sitemap files
    const sitemapFiles = [];
    chunks.forEach((chunk, index) => {
      const filename = index === 0 ? 'sitemap-main.xml' : `sitemap-${index + 1}.xml`;
      const xml = generateSitemapXML(chunk);
      
      fs.writeFileSync(path.join('public', filename), xml);
      sitemapFiles.push(filename);
      
      console.log(`✅ Created ${filename} with ${chunk.length} URLs`);
    });
    
    // Generate sitemap index
    const indexXml = generateSitemapIndex(sitemapFiles);
    fs.writeFileSync(path.join('public', 'sitemap.xml'), indexXml);
    
    console.log('✅ Created sitemap.xml (index)');
    console.log(`📊 Summary: ${uniqueUrls.length} total unique URLs across ${chunks.length} sitemap files`);
    
  } catch (error) {
    console.error('❌ Error generating sitemaps:', error);
  }
}

// Run the script
generateSitemaps(); 