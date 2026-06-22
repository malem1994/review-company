import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const policies = `
-- Enable RLS on storage.objects (usually already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public can view logos
CREATE OR REPLACE POLICY "Public can view logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

-- Policy 2: Authenticated users can upload logos
CREATE OR REPLACE POLICY "Authenticated users can upload logos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'logos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'logos'
  );

-- Policy 3: Users can update own uploads
CREATE OR REPLACE POLICY "Users can update own logos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'logos'
    AND auth.role() = 'authenticated'
    AND owner = auth.uid()
  );

-- Policy 4: Users can delete own uploads
CREATE OR REPLACE POLICY "Users can delete own logos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'logos'
    AND auth.role() = 'authenticated'
    AND owner = auth.uid()
  );
`;

async function applyPolicies() {
  try {
    // Execute raw SQL via Supabase REST API
    // Using the PostgREST API to execute SQL
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/exec_sql`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify({ query: policies })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.log('SQL exec may not be available via REST, trying alternative...');
      console.log('Error:', error);
      
      // Alternative: Use Supabase JS client to call a function
      // We'll need to create the function first or use direct connection
      console.log('\nPlease run this SQL in Supabase Dashboard SQL Editor:');
      console.log(policies);
    } else {
      const result = await response.json();
      console.log('Policies applied successfully:', result);
    }
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    process.exit(0);
  }
}

applyPolicies();
