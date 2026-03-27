-- =========================================================
-- Give Golf - Complete Supabase Schema
-- Run this in the Supabase SQL Editor (safe to re-run)
-- NOTE: Create a public Storage bucket named "core" manually.
-- =========================================================

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- =========================================================
-- 1. EXTENSIONS
-- =========================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- 2. TABLES
-- =========================================================

-- Charity (no dependencies)
CREATE TABLE IF NOT EXISTS public."Charity" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  short_description text,
  category text NOT NULL,
  image_url text,
  website text,
  featured boolean DEFAULT false,
  total_raised numeric DEFAULT 0,
  events jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
);

-- Draw (no dependencies)
CREATE TABLE IF NOT EXISTS public."Draw" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  month text UNIQUE NOT NULL,
  draw_date date NOT NULL,
  mode text NOT NULL CHECK (mode IN ('random', 'algorithmic')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'simulated', 'published')),
  total_pool numeric DEFAULT 0,
  jackpot_rollover numeric DEFAULT 0,
  winning_numbers jsonb DEFAULT '[]'::jsonb,
  total_subscribers numeric DEFAULT 0
);

-- DrawResult (references Draw)
CREATE TABLE IF NOT EXISTS public."DrawResult" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  draw_id uuid REFERENCES public."Draw"(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  user_name text,
  matched_numbers jsonb DEFAULT '[]'::jsonb,
  matched_scores jsonb DEFAULT '[]'::jsonb,
  match_count integer DEFAULT 0,
  match_type text,
  prize_amount numeric DEFAULT 0,
  month text
);

-- Users (references Charity)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  email text UNIQUE NOT NULL,
  full_name text,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  subscription_status text DEFAULT 'none',
  selected_charity_id uuid REFERENCES public."Charity"(id),
  charity_contribution_pct numeric DEFAULT 10
);

-- Subscriptions (references users)
CREATE TABLE IF NOT EXISTS public."Subscription" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  user_email text NOT NULL,
  user_id uuid REFERENCES public.users(id),
  plan text NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  amount numeric,
  start_date date,
  end_date date,
  stripe_subscription_id text,
  charity_contribution_pct numeric DEFAULT 10
);

-- Scores (references users)
CREATE TABLE IF NOT EXISTS public."Score" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  user_email text NOT NULL,
  user_id uuid REFERENCES public.users(id),
  score_data jsonb NOT NULL,
  play_date date NOT NULL
);

-- Winners (references users and Draw)
CREATE TABLE IF NOT EXISTS public."Winner" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  user_email text NOT NULL,
  user_id uuid REFERENCES public.users(id),
  draw_id uuid REFERENCES public."Draw"(id),
  prize_amount numeric,
  match_type text,
  month text,
  proof_image_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'paid'))
);

-- UserCharity (references users and Charity)
CREATE TABLE IF NOT EXISTS public."UserCharity" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  user_email text NOT NULL,
  user_id uuid REFERENCES public.users(id),
  charity_id uuid REFERENCES public."Charity"(id),
  charity_name text,
  percentage numeric DEFAULT 100
);

-- =========================================================
-- 3. INDEXES
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_charity_status ON public."Charity"(status);
CREATE INDEX IF NOT EXISTS idx_draw_month ON public."Draw"(month);
CREATE INDEX IF NOT EXISTS idx_sub_email ON public."Subscription"(user_email);
CREATE INDEX IF NOT EXISTS idx_score_email ON public."Score"(user_email);
CREATE INDEX IF NOT EXISTS idx_winner_email ON public."Winner"(user_email);
CREATE INDEX IF NOT EXISTS idx_drawresult_draw ON public."DrawResult"(draw_id);

-- =========================================================
-- 4. FUNCTIONS
-- =========================================================

-- is_admin(): SECURITY DEFINER bypasses RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
DECLARE
  u_role text;
BEGIN
  -- Fallback 1: Check JWT email (fastest, no recursion)
  IF (auth.jwt() ->> 'email') = 'admin@fairwayimpact.com' THEN
    RETURN true;
  END IF;

  -- Fallback 2: Check JWT app_metadata
  IF (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' THEN
    RETURN true;
  END IF;

  -- Fallback 3: Check public.users table (SECURITY DEFINER bypasses RLS)
  SELECT role INTO u_role FROM public.users WHERE id = auth.uid();
  RETURN u_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- handle_new_user(): auto-creates a profile row when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    CASE WHEN NEW.email = 'admin@fairwayimpact.com' THEN 'admin' ELSE 'user' END
  )
  ON CONFLICT (email) DO UPDATE
    SET id = EXCLUDED.id,
        role = CASE
          WHEN EXCLUDED.email = 'admin@fairwayimpact.com' THEN 'admin'
          ELSE public.users.role
        END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- 5. ROW LEVEL SECURITY
-- =========================================================
ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Charity"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Score"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Winner"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserCharity"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Draw"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."DrawResult"   ENABLE ROW LEVEL SECURITY;

-- Charity
CREATE POLICY "Charity read" ON public."Charity" FOR SELECT USING (true);
CREATE POLICY "Charity admin write" ON public."Charity" FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Users
CREATE POLICY "Users read own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins read all users" ON public.users FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins update all users" ON public.users FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins insert users" ON public.users FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- Subscriptions
CREATE POLICY "Users view own subs" ON public."Subscription" FOR SELECT USING (user_email = (auth.jwt() ->> 'email'));
CREATE POLICY "Users manage own subs" ON public."Subscription" FOR ALL USING (user_email = (auth.jwt() ->> 'email')) WITH CHECK (user_email = (auth.jwt() ->> 'email'));
CREATE POLICY "Admins view all subs" ON public."Subscription" FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins manage all subs" ON public."Subscription" FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Scores
CREATE POLICY "Users manage own scores" ON public."Score" FOR ALL USING (user_email = (auth.jwt() ->> 'email')) WITH CHECK (user_email = (auth.jwt() ->> 'email'));
CREATE POLICY "Admins manage all scores" ON public."Score" FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Winners
CREATE POLICY "Public view winners" ON public."Winner" FOR SELECT USING (true);
CREATE POLICY "Admins manage winners" ON public."Winner" FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Draws
CREATE POLICY "Authenticated view draws" ON public."Draw" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage draws" ON public."Draw" FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- UserCharity
CREATE POLICY "Users manage own charity" ON public."UserCharity" FOR ALL USING (user_email = (auth.jwt() ->> 'email')) WITH CHECK (user_email = (auth.jwt() ->> 'email'));
CREATE POLICY "Admins manage all charities" ON public."UserCharity" FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- DrawResult
CREATE POLICY "Admins manage DrawResult" ON public."DrawResult" FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =========================================================
-- 6. PERMISSIONS
-- =========================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- =========================================================
-- 7. SEED DATA
-- =========================================================
BEGIN;

-- Charities
INSERT INTO public."Charity" (name, description, short_description, category, featured, total_raised, image_url, website)
VALUES
  ('Green Fairways Initiative', 'Dedicated to environmental conservation on golf courses worldwide.', 'Leading the way in sustainable golf.', 'Environment', true, 142500, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2070', 'https://greenfairways.org'),
  ('Junior Golf Foundation', 'Providing equipment and scholarships to underprivileged youth.', 'Empowering the next generation.', 'Education', true, 89400, 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?q=80&w=2076', 'https://juniorgolffoundation.org'),
  ('The Par-Tee Care Network', 'Emergency financial assistance to former golf course employees.', 'Community care for the golf world.', 'Social', true, 67200, 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070', 'https://partecare.org')
ON CONFLICT (name) DO NOTHING;

-- Admin user row
INSERT INTO public.users (id, email, full_name, role, subscription_status)
VALUES ('d1a2b3c4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'admin@fairwayimpact.com', 'Admin User', 'admin', 'active')
ON CONFLICT (id) DO NOTHING;

COMMIT;

SELECT 'Give Golf schema applied successfully!' AS status;
