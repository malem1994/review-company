import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedRatings() {
  console.log('Seeding ratings...');

  // Get all companies
  const { data: companies } = await supabase.from('companies').select('id, name');
  console.log('Companies:', companies.map(c => c.name));

  // Get all profiles
  const { data: profiles } = await supabase.from('profiles').select('id, display_name');
  console.log('Available users:', profiles.map(p => p.display_name));

  if (!profiles || profiles.length === 0) {
    console.error('No profiles found. Need at least one user.');
    process.exit(1);
  }

  const userId1 = profiles[0].id; // Huy Nguyen
  const userId2 = profiles.length > 1 ? profiles[1].id : userId1;

  // Sample ratings for different companies (excluding FPT which already has one)
  const sampleRatings = [
    {
      company_id: companies.find(c => c.name === 'Techcombank')?.id,
      user_id: userId1,
      benefits: 4,
      environment: 4,
      leadership: 5,
      comment: 'Công ty có văn hóa tốt, lãnh đạo thân thiện và lắng nghe nhân viên. Trang thiết bị hiện đại, môi trường làm việc thoải mái.'
    },
    {
      company_id: companies.find(c => c.name === 'VNPT')?.id,
      user_id: userId2,
      benefits: 5,
      environment: 4,
      leadership: 4,
      comment: 'Môi trường ổn định, phúc lợi tốt. Cơ hội thăng tiến rõ ràng. Nhân viên hỗ trợ nhau rất tốt.'
    },
    {
      company_id: companies.find(c => c.name === 'MoMo')?.id,
      user_id: userId1,
      benefits: 5,
      environment: 5,
      leadership: 4,
      comment: 'Startup với môi trường năng động, sáng tạo. Team nhỏ nhưng hiệu quả. Lương thưởng cạnh tranh.'
    },
    {
      company_id: companies.find(c => c.name === 'VinGroup')?.id,
      user_id: userId2,
      benefits: 3,
      environment: 4,
      leadership: 3,
      comment: 'Công ty lớn với nhiều cơ hội. Tuy nhiên quy trình có thể hơi cứng nhắc đôi khi.'
    }
  ].filter(r => r.company_id);

  // Insert ratings
  for (const rating of sampleRatings) {
    try {
      const { error } = await supabase
        .from('company_ratings')
        .insert(rating);

      if (error) {
        if (error.code === '23505') {
          console.log(`✓ Rating already exists`);
        } else {
          throw error;
        }
      } else {
        console.log(`✓ Inserted rating`);
      }
    } catch (err) {
      console.error(`Failed to insert rating:`, err.message);
    }
  }

  console.log('\nDone seeding!');
  process.exit(0);
}

seedRatings().catch(console.error);
