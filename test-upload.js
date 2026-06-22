import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
  try {
    // Test 1: List buckets
    const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
    console.log('Buckets:', buckets?.map(b => b.name) || []);
    
    if (listErr) {
      console.error('List buckets error:', listErr);
    }

    // Test 2: Try upload a dummy file to logos/test.txt
    const testContent = new Blob(['test'], { type: 'text/plain' });
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
    
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('logos')
      .upload('test-company/test.txt', testFile);
    
    console.log('Upload attempt:', uploadErr ? 'FAILED' : 'SUCCESS');
    if (uploadErr) {
      console.error('Upload error:', uploadErr.message);
      console.error('Full error:', uploadErr);
    } else {
      console.log('Uploaded to:', uploadData?.path);
      // Cleanup
      await supabase.storage.from('logos').remove([uploadData.path]);
      console.log('Cleaned up test file');
    }

    // Test 3: Try upload image (simulated with base64)
    // Create a simple PNG (1x1 transparent pixel)
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';
    const imgBinary = Buffer.from(pngBase64, 'base64');
    const imgFile = new File([imgBinary], 'test.png', { type: 'image/png' });

    const { data: imgUpload, error: imgErr } = await supabase.storage
      .from('logos')
      .upload('test-company/test.png', imgFile, {
        contentType: 'image/png'
      });

    console.log('Image upload:', imgErr ? 'FAILED' : 'SUCCESS');
    if (imgErr) {
      console.error('Image upload error:', imgErr.message);
    } else {
      console.log('Image path:', imgUpload?.path);
      // Get public URL
      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(imgUpload.path);
      console.log('Public URL:', publicUrl);
      // Cleanup
      await supabase.storage.from('logos').remove([imgUpload.path]);
      console.log('Cleaned up test image');
    }

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    process.exit(0);
  }
}

testUpload();
