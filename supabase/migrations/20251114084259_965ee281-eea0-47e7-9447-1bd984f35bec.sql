-- Table pour tracking GPS en temps réel
CREATE TABLE public.player_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(8, 2),
  mission_context TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Index pour requêtes temps réel
CREATE INDEX idx_player_positions_user_time ON public.player_positions(user_id, created_at DESC);
CREATE INDEX idx_player_positions_recent ON public.player_positions(created_at DESC);

-- RLS pour player_positions
ALTER TABLE public.player_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs peuvent créer leurs positions"
  ON public.player_positions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent voir leurs positions"
  ON public.player_positions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins peuvent voir toutes les positions"
  ON public.player_positions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
      AND email = ANY(ARRAY['admin@gardiens.paris', 'organisateur@gardiens.paris'])
    )
  );

-- Mettre à jour la table mission_configs avec coordonnées GPS
ALTER TABLE public.mission_configs 
  ADD COLUMN IF NOT EXISTS target_lat DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS target_lng DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS validation_type TEXT DEFAULT 'photo',
  ADD COLUMN IF NOT EXISTS ai_validation_prompt TEXT;

-- Mettre à jour les missions existantes avec coordonnées réelles de Paris
UPDATE public.mission_configs SET 
  target_lat = 48.857500,
  target_lng = 2.341900,
  validation_type = 'photo',
  ai_validation_prompt = 'Vérifie que la photo montre un mascaron (visage sculpté) sur le Pont-Neuf à Paris'
WHERE mission_id = 'pont-neuf';

UPDATE public.mission_configs SET 
  target_lat = 48.846100,
  target_lng = 2.346000,
  validation_type = 'photo',
  ai_validation_prompt = 'Vérifie que la photo montre le Panthéon de Paris ou son intérieur'
WHERE mission_id = 'pantheon';

UPDATE public.mission_configs SET 
  target_lat = 48.859900,
  target_lng = 2.326300,
  validation_type = 'photo',
  ai_validation_prompt = 'Vérifie que la photo montre une œuvre du Musée d''Orsay, particulièrement une peinture impressionniste'
WHERE mission_id = 'musee-orsay';

UPDATE public.mission_configs SET 
  target_lat = 48.858400,
  target_lng = 2.294500,
  validation_type = 'photo',
  ai_validation_prompt = 'Vérifie que la photo montre le Mur pour la Paix avec la Tour Eiffel visible en arrière-plan'
WHERE mission_id = 'tour-eiffel';

UPDATE public.mission_configs SET 
  target_lat = 48.867700,
  target_lng = 2.329400,
  validation_type = 'photo',
  ai_validation_prompt = 'Vérifie que la photo montre la Place Vendôme ou la colonne Vendôme avec un effet de lumière/reflet'
WHERE mission_id = 'place-vendome';

UPDATE public.mission_configs SET 
  target_lat = 48.873800,
  target_lng = 2.295000,
  validation_type = 'photo',
  ai_validation_prompt = 'Vérifie que la photo montre l''Arc de Triomphe et/ou la Flamme éternelle du Soldat inconnu'
WHERE mission_id = 'arc-triomphe';

-- Ajouter colonnes géolocalisation à submissions
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS location_valid BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS distance_from_target DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS ai_validation_result TEXT;

-- Activer realtime pour le suivi GPS
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_positions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;