import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSimpleSubdomain() {
  console.log('🧪 Testing simple subdomain lookup...\n');

  try {
    // Test with houston-tx
    const subdomain = 'houston-tx';
    const parts = subdomain.split('-');
    const stateCode = parts[parts.length - 1].toLowerCase();
    const cityName = parts.slice(0, -1).join('-').replace(/-/g, ' ');

    console.log(`🔍 Parsing subdomain: ${subdomain}`);
    console.log(`   City: ${cityName}`);
    console.log(`   State: ${stateCode.toUpperCase()}`);

    // Get state
    const { data: stateData, error: stateError } = await supabase
      .from('states')
      .select('id, name')
      .eq('abbreviation', stateCode.toUpperCase())
      .single();

    if (stateError) {
      console.error('❌ State error:', stateError);
      return;
    }

    console.log(`✅ Found state: ${stateData.name}`);

    // Capitalize first letter of each word for city name
    const capitalizedCityName = cityName.replace(/\b\w/g, c => c.toUpperCase());

    console.log(`🔍 Looking for city: "${capitalizedCityName}"`);

    // Get city - use limit(1) instead of single()
    const { data: cityData, error: cityError } = await supabase
      .from('cities')
      .select('name, states(abbreviation,name)')
      .eq('name', capitalizedCityName)
      .eq('state_id', stateData.id)
      .limit(1)
      .maybeSingle();

    if (cityError) {
      console.error('❌ City error:', cityError);
      return;
    }

    if (!cityData) {
      console.log('❌ City not found');
      return;
    }

    console.log(`✅ Found city: ${cityData.name}, ${cityData.states.name}`);
    console.log(`   Subdomain URL: https://${subdomain}.government-phone.co`);
    console.log(`   Internal URL: https://government-phone.co/${stateCode}/${cityData.name.toLowerCase().replace(/\s+/g, '-')}/`);

    // Generate HTML
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Government Phone Programs in ${cityData.name}, ${cityData.states.name}</title>
    <meta name="description" content="Get free government phones and internet in ${cityData.name}, ${cityData.states.name}. Apply for Lifeline and ACP programs.">
    <link rel="canonical" href="https://${subdomain}.government-phone.co">
</head>
<body>
    <h1>Government Phone Programs in ${cityData.name}, ${cityData.states.name}</h1>
    <p>Get free government phones and internet service in ${cityData.name}, ${cityData.states.name}.</p>
    <p><a href="https://government-phone.co/apply">Apply Now</a></p>
</body>
</html>`;

    console.log('\n✅ Subdomain system working!');
    console.log('HTML generated successfully for SEO-optimized subdomain.');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testSimpleSubdomain();
