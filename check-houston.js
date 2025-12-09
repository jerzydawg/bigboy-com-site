import { supabase } from './src/lib/supabase.js';

async function checkHouston() {
  try {
    
    // First get Texas state ID
    const { data: stateData, error: stateError } = await supabase
      .from('states')
      .select('id, name, abbreviation')
      .eq('abbreviation', 'TX')
      .single();
    
    if (stateError) {
      console.log('State error:', stateError);
      return;
    }
    
    console.log('Texas state data:', stateData);
    
    // Now check for Houston
    const { data: cityData, error: cityError } = await supabase
      .from('cities')
      .select('*')
      .eq('state_id', stateData.id)
      .ilike('name', '%houston%');
    
    if (cityError) {
      console.log('City error:', cityError);
      return;
    }
    
    console.log('Houston cities found:', cityData);
    
    // Also check all cities in Texas
    const { data: allCities, error: allError } = await supabase
      .from('cities')
      .select('name')
      .eq('state_id', stateData.id)
      .limit(10);
    
    if (!allError) {
      console.log('First 10 cities in Texas:', allCities);
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkHouston(); 