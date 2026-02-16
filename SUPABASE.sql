-- 1. PROFILES TABLE
-- Stores user-specific settings, plan status, and daily limits
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT UNIQUE,
  is_pro BOOLEAN DEFAULT FALSE,
  daily_image_count INTEGER DEFAULT 0,
  last_image_reset DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROJECTS TABLE
-- Stores the generated Next.js projects and their metadata
CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  prompt TEXT,
  generated_code JSONB, -- Stores the file structure { "page.tsx": "...", "components/Button.tsx": "..." }
  is_pinned BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROJECT MESSAGES TABLE
-- Stores the chat history for each specific project
CREATE TABLE public.project_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  text TEXT,
  image TEXT, -- Stores base64 or URL of the image
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES FOR PROFILES
-- Users can only read and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 6. RLS POLICIES FOR PROJECTS
-- Users can manage only the projects they created
CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- 7. RLS POLICIES FOR PROJECT MESSAGES
-- Users can access messages only if they own the parent project
CREATE POLICY "Users can view messages of own projects" ON public.project_messages
  FOR SELECT USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert messages to own projects" ON public.project_messages
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete messages of own projects" ON public.project_messages
  FOR DELETE USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

-- 8. AUTOMATIC PROFILE CREATION ON SIGNUP
-- This function runs whenever a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function above
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 9. HELPER INDEXES (For Performance)
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_messages_project_id ON public.project_messages(project_id);