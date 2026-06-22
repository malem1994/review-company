import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucket() {
  try {
    // Create bucket
    const { data, error } = await supabase.storage.createBucket('logos', {
      public: true,
      fileSizeLimit: 524288, // 500KB in bytes
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
    });

    if (error) {
      console.error('Error creating bucket:', error);
      
      // Check if bucket already exists
      if (error.message.includes('already exists')) {
        console.log('Bucket already exists, skipping...');
        return { exists: true };
      }
      throw error;
    }

    console.log('Bucket created successfully:', data);
    return data;
  } catch (err) {
    console.error('Failed to create bucket:', err);
    throw err;
  }
}

createBucket().then(() => {
  console.log('Done');
  process.exit(0);
}).catch(err => {
  process.exit(1);
});
