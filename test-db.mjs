import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDB() {
  console.log('Testing Supabase connection...');

  // Test companies
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('*');

  if (companiesError) {
    console.error('Failed to fetch companies:', companiesError);
  } else {
    console.log('Companies count:', companies.length);
  }

  // Test ratings - using batch fetch like the fixed code
  const { data: ratings, error: ratingsError } = await supabase
    .from('company_ratings')
    .select('*')
    .order('created_at', { ascending: false });

  if (ratingsError) {
    console.error('Failed to fetch ratings:', ratingsError);
  } else {
    console.log('Ratings count:', ratings.length);

    if (ratings.length > 0) {
      const userIds = [...new Set(ratings.map(r => r.user_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) || []);

      const ratingsWithNames = ratings.map(rating => ({
        ...rating,
        displayName: rating.user_id ? profileMap.get(rating.user_id) || undefined : undefined
      }));

      console.log('Ratings with display names:', JSON.stringify(ratingsWithNames, null, 2));
    }
  }

  // Test profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*');

  if (profilesError) {
    console.error('Failed to fetch profiles:', profilesError);
  } else {
    console.log('Profiles count:', profiles.length);
  }

  process.exit(0);
}

testDB().catch(console.error);
