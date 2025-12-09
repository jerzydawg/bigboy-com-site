/**
 * Verify comparison between CSV and Supabase cities
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

// Read CSV and extract city names
function readCSVCities(filePath) {
  const csvContent = fs.readFileSync(filePath, 'utf-8');
  const lines = csvContent.split('\n');
  const cities = new Set();
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    if (values.length < 2) continue;
    
    let cityName = values[1].replace(/^"|"$/g, '').trim();
    if (cityName) {
      cityName = cityName.toLowerCase().replace(/\s+/g, ' ').trim();
      cities.add(cityName);
    }
  }
  
  return cities;
}

// Normalize city name for comparison
function normalizeCityName(name) {
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

async function verifyComparison() {
  const csvPath = '/Users/bartstrellz/Downloads/Telegram Desktop/us-cities.csv';
  
  console.log('📖 Reading CSV file...');
  const csvCities = readCSVCities(csvPath);
  console.log(`✅ Found ${csvCities.size} unique cities in CSV\n`);
  
  console.log('🔍 Fetching cities from Supabase...');
  
  // Fetch all cities
  let allCities = [];
  let offset = 0;
  const BATCH_SIZE = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data: cities, error } = await supabase
      .from('cities')
      .select('id, name')
      .order('name')
      .range(offset, offset + BATCH_SIZE - 1);
    
    if (error) {
      console.error('❌ Error:', error);
      break;
    }
    
    if (cities && cities.length > 0) {
      allCities = allCities.concat(cities);
      offset += BATCH_SIZE;
    } else {
      hasMore = false;
    }
    
    if (offset > 100000) break;
  }
  
  console.log(`✅ Found ${allCities.length} cities in Supabase\n`);
  
  // Compare
  let inCSV = 0;
  let notInCSV = 0;
  const notInCSVList = [];
  
  console.log('🔍 Comparing...\n');
  
  for (const city of allCities) {
    const normalized = normalizeCityName(city.name);
    if (csvCities.has(normalized)) {
      inCSV++;
    } else {
      notInCSV++;
      if (notInCSVList.length < 50) {
        notInCSVList.push(city);
      }
    }
  }
  
  console.log('📊 RESULTS:');
  console.log('═'.repeat(60));
  console.log(`Cities in Supabase: ${allCities.length}`);
  console.log(`Cities in CSV: ${csvCities.size}`);
  console.log(`Cities in Supabase that ARE in CSV: ${inCSV}`);
  console.log(`Cities in Supabase that are NOT in CSV: ${notInCSV}`);
  console.log(`Expected to keep: ${inCSV}`);
  console.log(`Expected to delete: ${notInCSV}`);
  console.log('═'.repeat(60));
  
  if (notInCSVList.length > 0) {
    console.log('\n📋 Sample cities NOT in CSV (first 20):');
    notInCSVList.slice(0, 20).forEach(city => {
      console.log(`   - ${city.name} (ID: ${city.id})`);
    });
  }
  
  // Check some specific examples
  console.log('\n🔍 Testing specific cities:');
  const testCities = ['Anchorage', 'Houston', 'New York', 'Los Angeles'];
  testCities.forEach(testCity => {
    const normalized = normalizeCityName(testCity);
    const inCSVCheck = csvCities.has(normalized);
    console.log(`   ${testCity}: ${inCSVCheck ? '✅ in CSV' : '❌ NOT in CSV'}`);
  });
}

verifyComparison()
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });


