#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSubdomains() {
  console.log('🧪 Testing subdomain system...\n');

  try {
    // Test cities to check
    const testCities = [
      { name: 'Houston', state: 'TX' },
      { name: 'New York', state: 'NY' },
      { name: 'Los Angeles', state: 'CA' },
      { name: 'Chicago', state: 'IL' },
      { name: 'Phoenix', state: 'AZ' }
    ];

    console.log('📊 Testing database queries...\n');

    for (const testCity of testCities) {
      console.log(`🔍 Testing: ${testCity.name}, ${testCity.state}`);
      
      const startTime = Date.now();
      
      const { data: cityData, error } = await supabase
        .from('cities')
        .select('name, states(abbreviation,name)')
        .eq('name', testCity.name)
        .eq('states.abbreviation', testCity.state)
        .maybeSingle();

      const queryTime = Date.now() - startTime;

      if (error) {
        console.error(`❌ Error querying ${testCity.name}:`, error);
        continue;
      }

      if (!cityData) {
        console.log(`⚠️  City not found: ${testCity.name}, ${testCity.state}`);
        continue;
      }

      // Generate subdomain
      const citySlug = cityData.name.toLowerCase().replace(/\s+/g, '-');
      const stateSlug = cityData.states.abbreviation.toLowerCase();
      const subdomain = `${citySlug}-${stateSlug}`;
      const subdomainUrl = `https://${subdomain}.government-phone.co`;

      console.log(`✅ Found: ${cityData.name}, ${cityData.states.name}`);
      console.log(`   Subdomain: ${subdomain}`);
      console.log(`   URL: ${subdomainUrl}`);
      console.log(`   Query time: ${queryTime}ms`);
      console.log('');
    }

    // Test performance with larger dataset
    console.log('📈 Performance test with 100 random cities...\n');
    
    const { data: randomCities, error: randomError } = await supabase
      .from('cities')
      .select('name, states(abbreviation,name)')
      .limit(100);

    if (randomError) {
      console.error('❌ Error fetching random cities:', randomError);
      return;
    }

    if (randomCities && randomCities.length > 0) {
      const startTime = Date.now();
      
      // Simulate subdomain lookups
      for (const city of randomCities) {
        const citySlug = city.name.toLowerCase().replace(/\s+/g, '-');
        const stateSlug = city.states.abbreviation.toLowerCase();
        const subdomain = `${citySlug}-${stateSlug}`;
        // console.log(`Generated: ${subdomain}.government-phone.co`);
      }
      
      const totalTime = Date.now() - startTime;
      console.log(`✅ Generated ${randomCities.length} subdomains in ${totalTime}ms`);
      console.log(`   Average time per subdomain: ${(totalTime / randomCities.length).toFixed(2)}ms`);
    }

    console.log('\n🎯 Subdomain system test complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Deploy to Netlify with custom domain');
    console.log('2. Set up wildcard DNS record');
    console.log('3. Test live subdomains');
    console.log('4. Monitor performance metrics');

  } catch (error) {
    console.error('❌ Error testing subdomains:', error);
    process.exit(1);
  }
}

// Run the test
testSubdomains();
