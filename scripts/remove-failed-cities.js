/**
 * Remove cities that failed the URL test from Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Extract city slug and state from URL
function parseCityUrl(url) {
  // URL format: https://government-phone.co/wi/argonne-cdp/
  const match = url.match(/government-phone\.co\/([a-z]{2})\/([^/]+)\/?$/);
  if (match) {
    return {
      stateAbbr: match[1].toUpperCase(),
      citySlug: match[2]
    };
  }
  return null;
}

// Convert slug to possible city names
function slugToNames(slug) {
  const names = [];
  
  // Basic conversion: hyphens to spaces, title case
  const spaceName = slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
  names.push(spaceName);
  
  // Hyphenated version
  const hyphenName = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-');
  names.push(hyphenName);
  
  // Mixed: first part title case, rest with hyphens
  const parts = slug.split('-');
  if (parts.length > 1) {
    const mixed = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    names.push(mixed);
  }
  
  return [...new Set(names)];
}

async function removeFailedCities() {
  // Read failures file
  const failuresPath = 'sitemap-test-failures.json';
  if (!fs.existsSync(failuresPath)) {
    console.error('❌ Failures file not found:', failuresPath);
    process.exit(1);
  }
  
  const failures = JSON.parse(fs.readFileSync(failuresPath, 'utf-8'));
  console.log(`📖 Found ${failures.length} failed URLs\n`);
  
  // Get all states for lookup
  const { data: states } = await supabase.from('states').select('id, abbreviation');
  const stateMap = new Map();
  states.forEach(s => stateMap.set(s.abbreviation, s.id));
  
  // Find cities to remove
  const citiesToRemove = [];
  
  console.log('🔍 Finding cities to remove...\n');
  
  for (const failure of failures) {
    const parsed = parseCityUrl(failure.url);
    if (!parsed) continue;
    
    const stateId = stateMap.get(parsed.stateAbbr);
    if (!stateId) continue;
    
    const possibleNames = slugToNames(parsed.citySlug);
    
    // Try to find the city with any of the possible names
    for (const name of possibleNames) {
      const { data: cities } = await supabase
        .from('cities')
        .select('id, name')
        .eq('state_id', stateId)
        .ilike('name', name);
      
      if (cities && cities.length > 0) {
        cities.forEach(city => {
          if (!citiesToRemove.find(c => c.id === city.id)) {
            citiesToRemove.push(city);
          }
        });
      }
    }
    
    // Also try partial match on the slug
    const { data: partialMatch } = await supabase
      .from('cities')
      .select('id, name')
      .eq('state_id', stateId)
      .ilike('name', `%${parsed.citySlug.replace(/-/g, '%')}%`);
    
    if (partialMatch && partialMatch.length > 0) {
      partialMatch.forEach(city => {
        if (!citiesToRemove.find(c => c.id === city.id)) {
          citiesToRemove.push(city);
        }
      });
    }
  }
  
  console.log(`✅ Found ${citiesToRemove.length} cities to remove\n`);
  
  if (citiesToRemove.length === 0) {
    console.log('⚠️  No cities found to remove');
    return;
  }
  
  // Show sample
  console.log('📋 Sample cities to remove (first 20):');
  citiesToRemove.slice(0, 20).forEach(c => {
    console.log(`   - ${c.name} (ID: ${c.id})`);
  });
  if (citiesToRemove.length > 20) {
    console.log(`   ... and ${citiesToRemove.length - 20} more`);
  }
  
  console.log('\n⚠️  Removing cities in 3 seconds... (Ctrl+C to cancel)');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Remove cities
  console.log('\n🗑️  Removing cities...');
  const batchSize = 50;
  let removed = 0;
  
  for (let i = 0; i < citiesToRemove.length; i += batchSize) {
    const batch = citiesToRemove.slice(i, i + batchSize);
    const ids = batch.map(c => c.id);
    
    const { error } = await supabase
      .from('cities')
      .delete()
      .in('id', ids);
    
    if (error) {
      console.error(`❌ Error removing batch:`, error);
    } else {
      removed += batch.length;
      process.stdout.write(`\r   Removed ${removed}/${citiesToRemove.length} cities`);
    }
  }
  
  console.log(`\n\n✅ Successfully removed ${removed} cities`);
  
  // Get final count
  const { count } = await supabase
    .from('cities')
    .select('id', { count: 'exact', head: true });
  
  console.log(`📊 Final city count: ${count}`);
}

removeFailedCities()
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });


