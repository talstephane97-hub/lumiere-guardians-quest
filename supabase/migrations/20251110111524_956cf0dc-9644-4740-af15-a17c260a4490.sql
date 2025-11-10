-- Création table profiles pour info utilisateurs
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  team_name TEXT,
  language TEXT DEFAULT 'fr',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs peuvent voir leur profil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Utilisateurs peuvent créer leur profil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Utilisateurs peuvent mettre à jour leur profil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger pour créer automatiquement le profil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Table missions_progress pour suivi progression
CREATE TABLE public.missions_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mission_id TEXT NOT NULL,
  day INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  proof_url TEXT,
  validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, mission_id)
);

ALTER TABLE public.missions_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs peuvent voir leur progression"
  ON public.missions_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent créer leur progression"
  ON public.missions_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent mettre à jour leur progression"
  ON public.missions_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Table keys_collected pour clés élémentaires
CREATE TABLE public.keys_collected (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  key_type TEXT NOT NULL CHECK (key_type IN ('eau', 'temps', 'air', 'feu')),
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, key_type)
);

ALTER TABLE public.keys_collected ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs peuvent voir leurs clés"
  ON public.keys_collected FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent collecter des clés"
  ON public.keys_collected FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Table regenerative_actions pour actes régénératifs
CREATE TABLE public.regenerative_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.regenerative_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs peuvent voir leurs actions"
  ON public.regenerative_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent créer des actions"
  ON public.regenerative_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Tous peuvent voir toutes les actions (feed communautaire)"
  ON public.regenerative_actions FOR SELECT
  USING (true);

-- Table chat_messages pour historique chatbot
CREATE TABLE public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs peuvent voir leurs messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent créer des messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();