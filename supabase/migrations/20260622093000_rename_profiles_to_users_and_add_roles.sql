-- Rename profiles to users and add role-based permissions
-- Date: 2026-06-22

-- 1. Create roles table first
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default roles
INSERT INTO public.roles (name, description) VALUES
  ('admin', 'Administrator with full access'),
  ('user', 'Regular authenticated user')
ON CONFLICT (name) DO NOTHING;

-- 2. Rename profiles to users
-- First, ensure the users table doesn't exist (drop if exists from previous attempts)
DROP TABLE IF EXISTS public.users CASCADE;

ALTER TABLE public.profiles RENAME TO users;

-- 3. Add role_id column to users
ALTER TABLE public.users
  ADD COLUMN role_id uuid REFERENCES public.roles(id) ON DELETE SET NULL;

-- Set default role for existing users (assume 'user' role)
UPDATE public.users
SET role_id = (SELECT id FROM public.roles WHERE name = 'user')
WHERE role_id IS NULL;

-- 4. Update handle_new_user trigger to set default role
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
    (SELECT id FROM public.roles WHERE name = 'user') -- Default role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = excluded.email,
    display_name = COALESCE(excluded.display_name, public.users.display_name),
    avatar_url = COALESCE(excluded.avatar_url, public.users.avatar_url),
    updated_at = now();
  RETURN new;
END;
$$;

-- 5. Update foreign key in company_ratings to reference users instead of profiles
-- First drop the existing constraint
ALTER TABLE public.company_ratings
  DROP CONSTRAINT IF EXISTS company_ratings_user_id_fkey;

-- Add new constraint referencing users table
ALTER TABLE public.company_ratings
  ADD CONSTRAINT company_ratings_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE SET NULL;

-- 6. Enable RLS on roles table
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for roles (readable by authenticated users)
DROP POLICY IF EXISTS "Roles are viewable by authenticated users" ON public.roles;
CREATE POLICY "Roles are viewable by authenticated users"
  ON public.roles
  FOR select
  TO authenticated
  USING (true);

-- 8. Update users RLS policies (adjust for renamed table)
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;
CREATE POLICY "Users are viewable by everyone"
  ON public.users
  FOR select
  USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR insert
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR update
  USING (auth.uid() = id);

-- 9. Add updated_at trigger for roles
DROP TRIGGER IF EXISTS roles_set_updated_at ON public.roles;
CREATE TRIGGER roles_set_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 10. Create index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_users_role_id ON public.users(role_id);
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);
