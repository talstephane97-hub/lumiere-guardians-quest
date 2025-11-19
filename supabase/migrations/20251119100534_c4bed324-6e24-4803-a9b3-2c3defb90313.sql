-- Ajouter les nouveaux champs aux missions existantes pour la régénération et la reconnaissance d'images
ALTER TABLE mission_configs 
ADD COLUMN IF NOT EXISTS regeneration_type TEXT CHECK (regeneration_type IN ('REGARD', 'ESPACE', 'LIEN', 'SYMBOLE', 'AUTRE')),
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS bonus_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_validation_threshold NUMERIC DEFAULT 0.7,
ADD COLUMN IF NOT EXISTS auto_validation_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS instructions TEXT;

-- Table pour stocker les images de référence pour chaque mission
CREATE TABLE IF NOT EXISTS mission_reference_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id TEXT NOT NULL REFERENCES mission_configs(mission_id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_mission_reference_images_mission_id ON mission_reference_images(mission_id);

-- RLS pour mission_reference_images
ALTER TABLE mission_reference_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins peuvent gérer les images de référence"
ON mission_reference_images
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Tout le monde peut voir les images de référence"
ON mission_reference_images
FOR SELECT
USING (true);

-- Améliorer la table submissions pour inclure le scoring de similarité
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS similarity_score NUMERIC,
ADD COLUMN IF NOT EXISTS auto_validated BOOLEAN DEFAULT false;

-- Table pour tracker le score total des joueurs
CREATE TABLE IF NOT EXISTS player_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  keys_points INTEGER DEFAULT 0,
  regeneration_points INTEGER DEFAULT 0,
  bonus_points INTEGER DEFAULT 0,
  euros_value NUMERIC GENERATED ALWAYS AS (total_points / 10.0) STORED,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS pour player_scores
ALTER TABLE player_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs peuvent voir leur score"
ON player_scores
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins peuvent voir tous les scores"
ON player_scores
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Le système peut mettre à jour les scores"
ON player_scores
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Le système peut updater les scores"
ON player_scores
FOR UPDATE
USING (auth.uid() = user_id);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_player_score_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_player_scores_updated_at
BEFORE UPDATE ON player_scores
FOR EACH ROW
EXECUTE FUNCTION update_player_score_timestamp();

-- Créer le bucket de stockage pour les images de référence si non existant
INSERT INTO storage.buckets (id, name, public)
VALUES ('mission-references', 'mission-references', false)
ON CONFLICT (id) DO NOTHING;

-- Politiques de stockage pour mission-references
CREATE POLICY "Admins peuvent uploader les images de référence"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'mission-references' 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins peuvent supprimer les images de référence"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'mission-references' 
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Tout le monde peut voir les images de référence"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'mission-references');