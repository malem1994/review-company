import { createClient } from './utils/supabase/client';

const supabase = createClient();

async function testDB() {
  console.log('Testing Supabase connection...');

  // Test companies
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('*');

  if (companiesError) {
    console.error('Failed to fetch companies:', companiesError);
  } else {
    console.log('Companies:', companies);
  }

  // Test ratings
  const { data: ratings, error: ratingsError } = await supabase
    .from('company_ratings')
    .select(`
      *,
      profiles (display_name)
    `);

  if (ratingsError) {
    console.error('Failed to fetch ratings:', ratingsError);
  } else {
    console.log('Ratings with profiles:', ratings);
  }

  // Test profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*');

  if (profilesError) {
    console.error('Failed to fetch profiles:', profilesError);
  } else {
    console.log('Profiles:', profiles);
  }

  process.exit(0);
}

testDB().catch(console.error);
