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

// SQL statements to execute
const sqlStatements = [
  // Storage policies
  `
  DROP POLICY IF EXISTS "Public can view logos" ON storage.objects;
  CREATE POLICY "Public can view logos" ON storage.objects
    FOR SELECT USING (bucket_id = 'logos');
  `,
  `
  DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
  CREATE POLICY "Authenticated users can upload logos" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'logos' 
      AND auth.role() = 'authenticated'
    );
  `,
  `
  DROP POLICY IF EXISTS "Users can update own logos" ON storage.objects;
  CREATE POLICY "Users can update own logos" ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'logos'
      AND auth.role() = 'authenticated'
      AND owner = auth.uid()
    );
  `,
  `
  DROP POLICY IF EXISTS "Users can delete own logos" ON storage.objects;
  CREATE POLICY "Users can delete own logos" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'logos'
      AND auth.role() = 'authenticated'
      AND owner = auth.uid()
    );
  `,
  // Roles migration
  `
  CREATE TABLE IF NOT EXISTS public.roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );
  `,
  `
  INSERT INTO public.roles (name, description) VALUES
    ('admin', 'Administrator with full access'),
    ('user', 'Regular authenticated user')
  ON CONFLICT (name) DO NOTHING;
  `,
  `
  DROP TABLE IF EXISTS public.users CASCADE;
  `,
  `
  ALTER TABLE public.profiles RENAME TO users;
  `,
  `
  ALTER TABLE public.users
    ADD COLUMN role_id uuid REFERENCES public.roles(id) ON DELETE SET NULL;
  `,
  `
  UPDATE public.users
  SET role_id = (SELECT id FROM public.roles WHERE name = 'user')
  WHERE role_id IS NULL;
  `,
  `
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
  BEGIN
    INSERT INTO public.users (id, email, display_name, avatar_url, role_id)
    VALUES (
      new.id,
      new.email,
      COALESCE(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        split_part(new.email, '@', 1)
      ),
      new.raw_user_meta_data->>'avatar_url',
      (SELECT id FROM public.roles WHERE name = 'user')
    )
    ON CONFLICT (id) DO UPDATE SET
      email = excluded.email,
      display_name = COALESCE(excluded.display_name, public.users.display_name),
      avatar_url = COALESCE(excluded.avatar_url, public.users.avatar_url),
      updated_at = now();
    RETURN new;
  END;
  $$;
  `,
  `
  ALTER TABLE public.company_ratings
    DROP CONSTRAINT IF EXISTS company_ratings_user_id_fkey;
  `,
  `
  ALTER TABLE public.company_ratings
    ADD CONSTRAINT company_ratings_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.users(id)
    ON DELETE SET NULL;
  `,
  `
  ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
  `,
  `
  DROP POLICY IF EXISTS "Roles are viewable by authenticated users" ON public.roles;
  CREATE POLICY "Roles are viewable by authenticated users"
    ON public.roles
    FOR select
    TO authenticated
    USING (true);
  `,
  `
  DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;
  CREATE POLICY "Users are viewable by everyone"
    ON public.users
    FOR select
    USING (true);
  `,
  `
  DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
  CREATE POLICY "Users can insert own profile"
    ON public.users
    FOR insert
    WITH CHECK (auth.uid() = id);
  `,
  `
  DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
  CREATE POLICY "Users can update own profile"
    ON public.users
    FOR update
    USING (auth.uid() = id);
  `,
  `
  DROP TRIGGER IF EXISTS roles_set_updated_at ON public.roles;
  CREATE TRIGGER roles_set_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_users_role_id ON public.users(role_id);
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);
  `
];

async function executeSQL() {
  console.log('Executing migrations with service role...\n');
  
  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i];
    try {
      // Use the PostgREST API to execute raw SQL via rpc
      // We'll use a different approach: direct fetch to Postgres
      // Actually, we can use the Supabase PostgREST to call a function
      // But simpler: use the database connection directly if possible
      // Or we can use pg library
      console.log(`\n--- Statement ${i + 1}/${sqlStatements.length} ---`);
      
      // Try using PostgREST's sql endpoint
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rpc/exec`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
          },
          body: JSON.stringify({ query: sql })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.log('Error (may be expected if no exec function):', error.message || error);
        console.log('Falling back to manual SQL execution in Dashboard...');
        console.log('\nPlease run this SQL in Supabase Dashboard SQL Editor:');
        console.log(sql);
        console.log('\n(You can skip this statement or run it manually)');
      } else {
        const result = await response.json();
        console.log('✅ Executed successfully');
      }
    } catch (err) {
      console.error('Failed to execute:', err);
    }
  }
  
  console.log('\n\n=== Migration Instructions ===');
  console.log('If some statements failed above, please manually run these migrations in Supabase Dashboard:');
  console.log('1. supabase/migrations/20260622090000_enable_storage_policies.sql');
  console.log('2. supabase/migrations/20260622093000_roles_and_rename_profiles.sql');
}

executeSQL();
