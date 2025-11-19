// src/lib/missionSubmissions.ts

import { supabase } from "@/integrations/supabase/client";

/**
 * Paramètres pour envoyer une preuve de mission (photo).
 */
type UploadMissionProofParams = {
  missionId: string; // identifiant de la mission
  userId: string;    // identifiant du joueur (session.user.id)
  file: File;        // la photo choisie par l'utilisateur
};

/**
 * 1) Upload l'image dans le bucket "mission-proofs"
 * 2) Crée une entrée dans la table "submissions"
 *    - mission_id
 *    - user_id
 *    - type = "photo"
 *    - code_verb_entered = URL publique de l'image
 */
export async function uploadMissionProof({
  missionId,
  userId,
  file,
}: UploadMissionProofParams) {
  // Chemin unique pour le fichier dans le Storage
  const timestamp = Date.now();
  const fileExt = file.name.split(".").pop();
  const filePath = `${userId}/${missionId}/${timestamp}.${fileExt}`;

  // 1) Upload dans le bucket "mission-proofs"
  const { error: storageError } = await supabase.storage
    .from("mission-proofs")
    .upload(filePath, file);

  if (storageError) {
    throw new Error(`Erreur upload image: ${storageError.message}`);
  }

  // 2) Récupérer l'URL publique de l'image
  const {
    data: { publicUrl },
  } = supabase.storage.from("mission-proofs").getPublicUrl(filePath);

  // 3) Créer une ligne dans "submissions"
  const { data: dbData, error: dbError } = await supabase
    .from("submissions")
    .insert({
      mission_id: missionId,
      user_id: userId,
      type: "photo",
      code_verb_entered: publicUrl,
    })
    .select()
    .single();

  if (dbError) {
    throw new Error(`Erreur enregistrement BDD: ${dbError.message}`);
  }

  return dbData;
}
