-- ============================================================
-- BuildWorkSpace — Schema Supabase
-- Eseguire nel SQL Editor di Supabase
-- ============================================================

-- Tabella profiles (estende auth.users)
CREATE TABLE public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name  text,
  avatar_color  text DEFAULT '#4A90D9'
);

-- Tabella projects
CREATE TABLE public.projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL CHECK (char_length(name) <= 40),
  cover_url   text,
  created_by  uuid REFERENCES auth.users NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- Tabella tasks
CREATE TABLE public.tasks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid REFERENCES public.projects ON DELETE CASCADE NOT NULL,
  text         text NOT NULL CHECK (char_length(text) <= 500),
  assignee     uuid REFERENCES auth.users,
  due_date     date,
  done         boolean DEFAULT false NOT NULL,
  created_by   uuid REFERENCES auth.users NOT NULL,
  created_at   timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Tabella ideas
CREATE TABLE public.ideas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid REFERENCES public.projects ON DELETE CASCADE NOT NULL,
  text        text NOT NULL CHECK (char_length(text) <= 1000),
  created_by  uuid REFERENCES auth.users NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas     ENABLE ROW LEVEL SECURITY;

-- Profiles: utenti autenticati leggono/scrivono
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Projects: tutti gli autenticati leggono/scrivono/eliminano
CREATE POLICY "projects_select" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "projects_insert" ON public.projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "projects_update" ON public.projects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "projects_delete" ON public.projects FOR DELETE TO authenticated USING (true);

-- Tasks
CREATE POLICY "tasks_select" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "tasks_delete" ON public.tasks FOR DELETE TO authenticated USING (true);

-- Ideas
CREATE POLICY "ideas_select" ON public.ideas FOR SELECT TO authenticated USING (true);
CREATE POLICY "ideas_insert" ON public.ideas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ideas_update" ON public.ideas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "ideas_delete" ON public.ideas FOR DELETE TO authenticated USING (true);

-- ============================================================
-- Trigger: crea profilo automaticamente alla registrazione
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  colors text[] := ARRAY['#4A90D9','#E84444','#6FAB47','#E8B947','#9B59B6','#E67E22'];
  picked text;
BEGIN
  picked := colors[1 + (FLOOR(RANDOM() * 6))::int];
  INSERT INTO public.profiles (id, display_name, avatar_color)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    picked
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- Storage bucket "covers"
-- ============================================================

-- Eseguire separatamente nella sezione Storage di Supabase oppure via API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true);

-- Policy storage
CREATE POLICY "covers_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'covers');
CREATE POLICY "covers_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'covers');
CREATE POLICY "covers_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'covers');

-- ============================================================
-- Sprint 3: tag e priority su ideas e tasks
-- Eseguire nel SQL Editor di Supabase
-- ============================================================

ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS tag      text DEFAULT NULL;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS priority text DEFAULT NULL;

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS tag      text DEFAULT NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS priority text DEFAULT NULL;

-- ============================================================
-- Sprint 3b: Cartelle idee
-- ============================================================

CREATE TABLE IF NOT EXISTS public.idea_folders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid REFERENCES public.projects ON DELETE CASCADE NOT NULL,
  name        text NOT NULL CHECK (char_length(name) <= 60),
  created_by  uuid REFERENCES auth.users NOT NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.ideas
  ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.idea_folders ON DELETE SET NULL;

ALTER TABLE public.idea_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "idea_folders_select" ON public.idea_folders FOR SELECT TO authenticated USING (true);
CREATE POLICY "idea_folders_insert" ON public.idea_folders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "idea_folders_update" ON public.idea_folders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "idea_folders_delete" ON public.idea_folders FOR DELETE TO authenticated USING (true);
