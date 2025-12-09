#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateSubdomainUrls() {
  console.log('🚀 Generating subdomain URLs for all cities...\n');

  try {
    // Fetch all cities with their states (handle large datasets)
    console.log('📊 Fetching cities from database...');
    
    let allCities = [];
    let page = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data: cities, error } = await supabase
        .from('cities')
        .select('name, states(abbreviation, name)')
        .order('name')
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        console.error('❌ Database error:', error);
        process.exit(1);
      }

      if (!cities || cities.length === 0) {
        break;
      }

      allCities = allCities.concat(cities);
      console.log(`📄 Fetched page ${page + 1}: ${cities.length} cities`);
      page++;
    }

    console.log(`\n📊 Total cities found: ${allCities.length}\n`);

    if (allCities.length === 0) {
      console.log('⚠️  No cities found in database');
      return;
    }

    // Generate subdomain URLs
    console.log('🔗 Generating subdomain URLs...');
    const subdomainUrls = allCities.map(city => {
      const citySlug = city.name.toLowerCase().replace(/\s+/g, '-');
      const stateSlug = city.states.abbreviation.toLowerCase();
      const subdomain = `${citySlug}-${stateSlug}`;
      
      return {
        city: city.name,
        state: city.states.name,
        stateCode: city.states.abbreviation,
        subdomain: subdomain,
        url: `https://${subdomain}.government-phone.co`,
        internalUrl: `https://government-phone.co/${stateSlug}/${citySlug}/`
      };
    });

    // Create output directory
    const outputDir = path.join(process.cwd(), 'generated');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Generate CSV file (chunked for large datasets)
    console.log('📄 Generating CSV file...');
    const csvHeader = 'City,State,State Code,Subdomain,Subdomain URL,Internal URL\n';
    const csvChunks = [csvHeader];
    
    subdomainUrls.forEach(city => {
      csvChunks.push(`"${city.city}","${city.state}","${city.stateCode}","${city.subdomain}","${city.url}","${city.internalUrl}"`);
    });

    fs.writeFileSync(path.join(outputDir, 'subdomain-urls.csv'), csvChunks.join('\n'));

    // Generate JSON file (chunked for large datasets)
    console.log('📄 Generating JSON file...');
    fs.writeFileSync(
      path.join(outputDir, 'subdomain-urls.json'), 
      JSON.stringify(subdomainUrls, null, 2)
    );

    // Generate sitemap XML (chunked for large datasets)
    console.log('📄 Generating sitemap XML...');
    const sitemapHeader = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    const sitemapFooter = '</urlset>';
    
    const sitemapUrls = subdomainUrls.map(city => `  <url>
    <loc>${city.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n');

    fs.writeFileSync(
      path.join(outputDir, 'subdomain-sitemap.xml'), 
      sitemapHeader + '\n' + sitemapUrls + '\n' + sitemapFooter
    );

    // Generate robots.txt for subdomains
    console.log('📄 Generating robots.txt...');
    const robotsContent = `User-agent: *
Allow: /

# Sitemap for subdomains
Sitemap: https://government-phone.co/subdomain-sitemap.xml

# Crawl-delay for subdomains
Crawl-delay: 1`;

    fs.writeFileSync(path.join(outputDir, 'robots.txt'), robotsContent);

    // Generate sitemap index for large datasets
    if (subdomainUrls.length > 50000) {
      console.log('📄 Generating sitemap index for large dataset...');
      const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://government-phone.co/subdomain-sitemap.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
</sitemapindex>`;
      
      fs.writeFileSync(path.join(outputDir, 'sitemap-index.xml'), sitemapIndex);
    }

    // Display statistics
    console.log('\n📊 Statistics:');
    console.log(`  Total cities: ${subdomainUrls.length}`);
    console.log(`  Total subdomains: ${subdomainUrls.length}`);
    console.log(`  Estimated URLs: ${subdomainUrls.length}`);

    // Display sample URLs
    console.log('\n📋 Sample subdomain URLs:');
    subdomainUrls.slice(0, 10).forEach(city => {
      console.log(`  ${city.url} → ${city.city}, ${city.state}`);
    });

    if (subdomainUrls.length > 10) {
      console.log(`  ... and ${subdomainUrls.length - 10} more`);
    }

    console.log('\n📁 Generated files:');
    console.log(`  📄 ${path.join(outputDir, 'subdomain-urls.csv')} (${(fs.statSync(path.join(outputDir, 'subdomain-urls.csv')).size} bytes)`);
    console.log(`  📄 ${path.join(outputDir, 'subdomain-urls.json')} (${(fs.statSync(path.join(outputDir, 'subdomain-urls.json')).size} bytes)`);
    console.log(`  📄 ${path.join(outputDir, 'subdomain-sitemap.xml')} (${(fs.statSync(path.join(outputDir, 'subdomain-sitemap.xml')).size} bytes)`);
    console.log(`  📄 ${path.join(outputDir, 'robots.txt')} (${(fs.statSync(path.join(outputDir, 'robots.txt')).size} bytes)`);

    if (subdomainUrls.length > 50000) {
      console.log(`  📄 ${path.join(outputDir, 'sitemap-index.xml')} (${(fs.statSync(path.join(outputDir, 'sitemap-index.xml')).size} bytes)`);
    }

    console.log('\n✅ Subdomain URL generation complete!');
    console.log('\n🔗 Next steps:');
    console.log('1. Set up wildcard DNS record for *.government-phone.co');
    console.log('2. Configure Netlify for custom domain with wildcard SSL');
    console.log('3. Upload sitemap to Google Search Console');
    console.log('4. Test subdomains with curl or browser');
    console.log('5. Monitor performance and adjust caching as needed');

  } catch (error) {
    console.error('❌ Error generating subdomain URLs:', error);
    process.exit(1);
  }
}

// Run the script
generateSubdomainUrls();
