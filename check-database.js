import { createClient } from '@supabase/supabase-js';

async function checkDatabase() {
  try {
    const supabaseUrl = 'https://amhtjazsxrbftufkhwhf.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtaHRqYXpzeHJiZnR1Zmtod2hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI5NzAsImV4cCI6MjA1MDU0ODk3MH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('=== Checking Georgia State ===');
    
    // Get Georgia state
    const { data: georgiaState, error: georgiaError } = await supabase
      .from('states')
      .select('*')
      .eq('abbreviation', 'GA')
      .single();
    
    if (georgiaError) {
      console.error('Error fetching Georgia state:', georgiaError);
      return;
    }
    
    console.log('Georgia state:', georgiaState);
    
    // Get cities in Georgia
    const { data: georgiaCities, error: georgiaCitiesError } = await supabase
      .from('cities')
      .select('*')
      .eq('state_id', georgiaState.id)
      .order('population', { ascending: false })
      .limit(10);
    
    if (georgiaCitiesError) {
      console.error('Error fetching Georgia cities:', georgiaCitiesError);
      return;
    }
    
    console.log('Cities in Georgia:', georgiaCities);
    
    // Check if any Texas cities are incorrectly in Georgia
    const texasCitiesInGeorgia = georgiaCities.filter(city => 
      ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'Arlington'].includes(city.name)
    );
    
    if (texasCitiesInGeorgia.length > 0) {
      console.log('❌ PROBLEM FOUND: Texas cities incorrectly in Georgia:', texasCitiesInGeorgia);
      
      // Get Texas state ID
      const { data: texasState, error: texasError } = await supabase
        .from('states')
        .select('*')
        .eq('abbreviation', 'TX')
        .single();
      
      if (!texasError && texasState) {
        console.log('Texas state ID:', texasState.id);
        
        // Fix the incorrect cities
        for (const city of texasCitiesInGeorgia) {
          console.log(`Fixing ${city.name} - moving from Georgia (${georgiaState.id}) to Texas (${texasState.id})`);
          
          const { error: updateError } = await supabase
            .from('cities')
            .update({ state_id: texasState.id })
            .eq('id', city.id);
          
          if (updateError) {
            console.error(`Error updating ${city.name}:`, updateError);
          } else {
            console.log(`✅ Fixed ${city.name}`);
          }
        }
      }
    } else {
      console.log('✅ No Texas cities found in Georgia');
    }
    
    // Get correct Georgia cities
    const correctGeorgiaCities = [
      'Atlanta', 'Augusta', 'Columbus', 'Macon', 'Savannah', 'Athens', 'Sandy Springs', 
      'Roswell', 'Albany', 'Johns Creek', 'Warner Robins', 'Alpharetta', 'Marietta', 
      'Valdosta', 'Smyrna', 'Dunwoody', 'Rome', 'Gainesville', 'East Point', 'Hinesville'
    ];
    
    console.log('\n=== Checking for correct Georgia cities ===');
    for (const cityName of correctGeorgiaCities) {
      const { data: city, error: cityError } = await supabase
        .from('cities')
        .select('*')
        .eq('name', cityName)
        .eq('state_id', georgiaState.id)
        .single();
      
      if (cityError) {
        console.log(`❌ Missing: ${cityName} in Georgia`);
      } else {
        console.log(`✅ Found: ${cityName} in Georgia`);
      }
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkDatabase(); 