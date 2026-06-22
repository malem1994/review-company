import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkamZ0am1sdmlycnF5Z2V3aXBxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgxNzc1OSwiZXhwIjoyMDg5MzkzNzU5fQ.mhqE6YL2Z9XqURiiQOnoqRkCts_dTwqvGGStFMQ61u8';

// Use service role for admin operations
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupStorage() {
  try {
    console.log('Checking existing buckets...');
    const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
    
    if (listErr) {
      console.error('List buckets error:', listErr);
      return;
    }

    console.log('Existing buckets:', buckets.map(b => b.name));

    // Check if logos bucket exists
    const logosBucket = buckets.find(b => b.name === 'logos');
    
    if (!logosBucket) {
      console.log('Creating logos bucket...');
      // Note: createBucket might not be available in JS client for storage
      // We'll need to use the REST API directly or create via Dashboard
      console.log('Bucket logos not found. Please create it manually in Supabase Dashboard:');
      console.log('1. Go to Storage → Buckets');
      console.log('2. Click "New bucket"');
      console.log('3. Name: logos, Public: ON, Size limit: 500KB, MIME: image/png,image/jpeg,image/webp');
    } else {
      console.log('Bucket logos already exists');
      console.log('Bucket details:', logosBucket);
    }

    // Try to set bucket as public via update
    if (logosBucket && !logosBucket.public) {
      console.log('Updating bucket to public...');
      // Update bucket to be public
      const { error: updateErr } = await supabase.storage.updateBucket('logos', {
        public: true,
        fileSizeLimit: 524288,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
      });

      if (updateErr) {
        console.error('Update bucket error:', updateErr);
      } else {
        console.log('Bucket updated to public');
      }
    }

  } catch (err) {
    console.error('Setup failed:', err);
  } finally {
    process.exit(0);
  }
}

setupStorage();
