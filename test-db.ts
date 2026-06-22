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
    .select('*')
    .order('created_at', { ascending: false });

  if (ratingsError) {
    console.error('Failed to fetch ratings:', ratingsError);
  } else {
    console.log('Ratings count:', ratings.length);

    if (ratings.length > 0) {
      const userIds = [...new Set(ratings.map(r => r.user_id).filter(Boolean))];
      const { data: users } = await supabase
        .from('users')
        .select('id, display_name')
        .in('id', userIds);

      const userMap = new Map(users?.map(u => [u.id, u.display_name]) || []);

      const ratingsWithNames = ratings.map(rating => ({
        ...rating,
        displayName: rating.user_id ? userMap.get(rating.user_id) || undefined : undefined
      }));
      console.log('Ratings with display names:', JSON.stringify(ratingsWithNames, null, 2));
    }
  }

  // Test users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*');

  if (usersError) {
    console.error('Failed to fetch users:', usersError);
  } else {
    console.log('Users:', users);
  }

  // Test roles
  const { data: roles, error: rolesError } = await supabase
    .from('roles')
    .select('*');

  if (rolesError) {
    console.error('Failed to fetch roles:', rolesError);
  } else {
    console.log('Roles:', roles);
  }

  process.exit(0);
}

testDB().catch(console.error);
