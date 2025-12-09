import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCities() {
  console.log('🔍 Checking cities in database...\n');

  try {
    // Check for cities with "houston" in the name
    const { data: houstonCities, error: houstonError } = await supabase
      .from('cities')
      .select('name, states(abbreviation,name)')
      .ilike('name', '%houston%')
      .limit(10);

    if (houstonError) {
      console.error('❌ Error:', houstonError);
      return;
    }

    console.log('Cities with "houston" in name:');
    houstonCities.forEach(city => {
      console.log(`  - ${city.name}, ${city.states.abbreviation}`);
    });

    // Check for cities in Texas
    const { data: texasCities, error: texasError } = await supabase
      .from('cities')
      .select('name, states(abbreviation,name)')
      .eq('states.abbreviation', 'TX')
      .limit(10);

    if (texasError) {
      console.error('❌ Error:', texasError);
      return;
    }

    console.log('\nCities in Texas:');
    texasCities.forEach(city => {
      console.log(`  - ${city.name}, ${city.states.abbreviation}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkCities();
