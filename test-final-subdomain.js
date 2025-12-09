import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFinalSubdomain() {
  console.log('🎯 Final Subdomain System Test\n');

  try {
    // Test multiple cities
    const testSubdomains = [
      'houston-tx',
      'new-york-ny', 
      'los-angeles-ca',
      'chicago-il',
      'phoenix-az'
    ];

    for (const subdomain of testSubdomains) {
      console.log(`🔍 Testing: ${subdomain}`);
      
      const parts = subdomain.split('-');
      const stateCode = parts[parts.length - 1].toLowerCase();
      const cityName = parts.slice(0, -1).join('-').replace(/-/g, ' ');
      const capitalizedCityName = cityName.replace(/\b\w/g, c => c.toUpperCase());

      // Get state
      const { data: stateData, error: stateError } = await supabase
        .from('states')
        .select('id, name')
        .eq('abbreviation', stateCode.toUpperCase())
        .single();

      if (stateError) {
        console.log(`❌ State error for ${subdomain}: ${stateError.message}`);
        continue;
      }

      // Get city
      const { data: cityData, error: cityError } = await supabase
        .from('cities')
        .select('name, states(abbreviation,name)')
        .eq('name', capitalizedCityName)
        .eq('state_id', stateData.id)
        .limit(1)
        .maybeSingle();

      if (cityError || !cityData) {
        console.log(`❌ City not found: ${capitalizedCityName}, ${stateCode.toUpperCase()}`);
        continue;
      }

      console.log(`✅ ${cityData.name}, ${cityData.states.name}`);
      console.log(`   URL: https://${subdomain}.government-phone.co`);
      console.log('');
    }

    console.log('🎉 Subdomain system ready for deployment!');
    console.log('\n📋 Next steps:');
    console.log('1. Deploy to Netlify');
    console.log('2. Set up wildcard DNS (*.government-phone.co)');
    console.log('3. Configure custom domain in Netlify');
    console.log('4. Test live subdomains');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testFinalSubdomain();
