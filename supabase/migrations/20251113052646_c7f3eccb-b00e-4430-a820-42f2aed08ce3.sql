-- Supprimer toute référence aux QR codes et ajouter le système de validation par photo

-- Table pour les soumissions de preuves
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('photo', 'code_verb', 'auto')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  photo_url TEXT,
  code_verb_entered TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_submissions_status ON public.submissions(status);
CREATE INDEX idx_submissions_mission ON public.submissions(mission_id);
CREATE INDEX idx_submissions_user ON public.submissions(user_id);

-- Table pour les configurations de missions (géoloc, codes-verbes)
CREATE TABLE IF NOT EXISTS public.mission_configs (
  mission_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  day INTEGER NOT NULL CHECK (day BETWEEN 1 AND 3),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  radius_meters INTEGER DEFAULT 100,
  requires_photo BOOLEAN DEFAULT true,
  code_verb TEXT,
  code_verb_lang TEXT DEFAULT 'fr',
  order_index INTEGER NOT NULL
);

-- Insérer les configs pour les missions existantes (basées sur MissionsList.tsx)
INSERT INTO public.mission_configs (mission_id, title, day, location_lat, location_lng, requires_photo, code_verb, order_index) VALUES
  ('day1-briefing', 'L''Appel de la Lumière', 1, 48.8534, 2.3738, false, NULL, 1),
  ('day1-pont-neuf', 'Le Souffle de la Seine', 1, 48.8566, 2.3422, true, 'souffle', 2),
  ('day1-pantheon', 'Le Pendule du Temps', 1, 48.8462, 2.3464, true, 'temps', 3),
  ('day2-orsay', 'Renaissance des Arts', 2, 48.8600, 2.3266, true, 'renaissance', 4),
  ('day2-paix', 'Le Mur pour la Paix', 2, 48.8582, 2.2945, true, 'paix', 5),
  ('day3-vendome', 'L''Ombre Solaire', 3, 48.8677, 2.3297, true, 'feu', 6),
  ('day3-arc', 'La Flamme Éternelle', 3, 48.8738, 2.2950, true, 'lumière', 7);

-- Enable RLS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour submissions
CREATE POLICY "Utilisateurs peuvent créer leurs soumissions"
  ON public.submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent voir leurs soumissions"
  ON public.submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins peuvent tout voir"
  ON public.submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND email IN ('admin@gardiens.paris', 'organisateur@gardiens.paris')
    )
  );

CREATE POLICY "Admins peuvent mettre à jour"
  ON public.submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND email IN ('admin@gardiens.paris', 'organisateur@gardiens.paris')
    )
  );

-- RLS pour mission_configs (lecture publique)
CREATE POLICY "Tout le monde peut lire les configs"
  ON public.mission_configs FOR SELECT
  USING (true);

-- Trigger pour updated_at
CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket pour les photos de preuves
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'mission-proofs',
  'mission-proofs',
  false,
  8388608, -- 8MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
);

-- RLS pour storage
CREATE POLICY "Utilisateurs peuvent uploader leurs preuves"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'mission-proofs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Utilisateurs peuvent voir leurs preuves"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'mission-proofs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins peuvent voir toutes les preuves"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'mission-proofs' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND email IN ('admin@gardiens.paris', 'organisateur@gardiens.paris')
    )
  );