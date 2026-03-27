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
-- 7. SEED DATA (Real-World Organizations & Realistic Users)
-- =========================================================
BEGIN;

-- 7.1 Admin user row
INSERT INTO public.users (id, email, full_name, role, subscription_status)
VALUES ('d1a2b3c4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'admin@fairwayimpact.com', 'System Administrator', 'admin', 'active')
ON CONFLICT (id) DO NOTHING;

-- 7.2 Real-World Charity Partners
INSERT INTO public."Charity" (name, description, short_description, category, featured, total_raised, image_url, website, status)
VALUES
  ('TGR Foundation', 'Founded by Tiger Woods, the TGR Foundation is dedicated to empowering underprivileged students through STEM education and college access programs.', 'Empowering students through STEM.', 'Education', true, 2850000, 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=2070', 'https://tgrfoundation.org', 'active'),
  ('PGA HOPE', 'Helping Our Patriots Everywhere (HOPE) is the flagship military program of PGA REACH, introducing golf to veterans with disabilities to enhance their well-being.', 'Golf for veterans with disabilities.', 'Veterans', true, 1420000, 'https://images.unsplash.com/photo-1508847154043-be5407fcaa5a?q=80&w=2070', 'https://pgareach.org/services/military', 'active'),
  ('The First Tee', 'Shaping the lives of young people from all backgrounds by introducing them to the game of golf and its inherent values.', 'Building character through golf.', 'Youth', true, 3100000, 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?q=80&w=2076', 'https://firsttee.org', 'active'),
  ('Folds of Honor', 'Providing educational scholarships to the spouses and children of Americas fallen or disabled military service members.', 'Honoring the sacrifice.', 'Veterans', true, 5200000, 'https://images.unsplash.com/photo-1524338198850-8a2ff63aaceb?q=80&w=2070', 'https://foldsofhonor.org', 'active'),
  ('Youth on Course', 'Providing young people with access to life-changing opportunities through $5 or less rounds of golf and college scholarships.', 'Affordable golf for the next generation.', 'Youth', false, 890000, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2070', 'https://youthoncourse.org', 'active'),
  ('Els for Autism', 'Established by Ernie and Liezl Els, the foundation is dedicated to bettering the lives of individuals with autism through golf and specialized programs.', 'Golf for Autism spectrum support.', 'Health', false, 760000, 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=2070', 'https://elsforautism.org', 'active'),
  ('Birdies for the Brave', 'A national military outreach initiative supported by the PGA TOUR to honor and show appreciation for the courageous men and women of our Armed Forces.', 'Supporting our military families.', 'Veterans', false, 2100000, 'https://images.unsplash.com/photo-1459253331217-074023714df1?q=80&w=2070', 'https://birdiesforthebrave.org', 'active'),
  ('Payne Stewart Kids Golf Foundation', 'Introducing the game of golf to kids in underserved communities, emphasizing Stewart''s values of sportsmanship and faith.', 'Golf for underserved communities.', 'Youth', false, 420000, 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=2070', 'https://paynestewart.org', 'active')
ON CONFLICT (name) DO NOTHING;

-- 7.3 Realistic Users with Real Names
DO $$
DECLARE
    uid UUID;
    charity_id UUID;
    first_names TEXT[] := ARRAY['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen'];
    last_names TEXT[] := ARRAY['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
    f_name TEXT;
    l_name TEXT;
    full_name TEXT;
    user_email TEXT;
BEGIN
    FOR i IN 1..50 LOOP
        uid := gen_random_uuid();
        f_name := first_names[1 + (random() * (array_length(first_names, 1) - 1))::int];
        l_name := last_names[1 + (random() * (array_length(last_names, 1) - 1))::int];
        full_name := f_name || ' ' || l_name;
        user_email := lower(f_name) || '.' || lower(l_name) || i || '@gmail.com';
        
        SELECT id INTO charity_id FROM public."Charity" ORDER BY random() LIMIT 1;

        -- Create User Profile
        INSERT INTO public.users (id, email, full_name, role, subscription_status, selected_charity_id)
        VALUES (
            uid,
            user_email,
            full_name,
            'user',
            CASE WHEN i % 5 = 0 THEN 'none' ELSE 'active' END,
            charity_id
        ) ON CONFLICT (email) DO NOTHING;

        -- Create Subscriptions
        IF i % 5 != 0 THEN
            INSERT INTO public."Subscription" (user_email, user_id, plan, status, amount, start_date)
            VALUES (
                user_email,
                uid,
                CASE WHEN i % 3 = 0 THEN 'yearly' ELSE 'monthly' END,
                'active',
                CASE WHEN i % 3 = 0 THEN 199.99 ELSE 19.99 END,
                CURRENT_DATE - (i || ' days')::interval
            );
        END IF;

        -- Create Scores
        FOR j IN 1..2 LOOP
          INSERT INTO public."Score" (user_email, user_id, score_data, play_date)
          VALUES (
            user_email,
            uid,
            jsonb_build_object(
                'balls', ARRAY[(1+random()*48)::int, (1+random()*48)::int, (1+random()*48)::int, (1+random()*48)::int, (1+random()*48)::int], 
                'powerball', (1+random()*12)::int
            ),
            CURRENT_DATE - (j * 10 + floor(random() * 5))::int
          );
        END LOOP;
    END LOOP;
END $$;

-- 7.4 Historical Draws
INSERT INTO public."Draw" (month, draw_date, mode, status, total_pool, winning_numbers, total_subscribers)
VALUES 
  ('January 2026', '2026-01-31', 'algorithmic', 'published', 45000, '[14, 23, 31, 38, 44, 9]', 242),
  ('February 2026', '2026-02-28', 'algorithmic', 'published', 52000, '[5, 12, 28, 35, 41, 6]', 288),
  ('March 2026', '2026-03-31', 'algorithmic', 'pending', 61500, '[]', 315)
ON CONFLICT (month) DO NOTHING;

-- 7.5 Historical Winners
DO $$
DECLARE
    draw_id UUID;
    u_id UUID;
    u_email TEXT;
BEGIN
    SELECT id INTO draw_id FROM public."Draw" WHERE month = 'January 2026';
    IF draw_id IS NOT NULL THEN
        SELECT id, email INTO u_id, u_email FROM public.users ORDER BY random() LIMIT 1;
        INSERT INTO public."Winner" (user_email, user_id, draw_id, prize_amount, match_type, month, status)
        VALUES (u_email, u_id, draw_id, 10000, '4 Balls + Powerball', 'January 2026', 'paid');
    END IF;

    SELECT id INTO draw_id FROM public."Draw" WHERE month = 'February 2026';
    IF draw_id IS NOT NULL THEN
        SELECT id, email INTO u_id, u_email FROM public.users ORDER BY random() LIMIT 1;
        INSERT INTO public."Winner" (user_email, user_id, draw_id, prize_amount, match_type, month, status)
        VALUES (u_email, u_id, draw_id, 25000, 'Full Match', 'February 2026', 'verified');
    END IF;
END $$;

COMMIT;

SELECT 'Real-world data and realistic users applied to schema!' AS status;
