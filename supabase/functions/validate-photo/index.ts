import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submissionPhotoUrl, missionId } = await req.json();

    if (!submissionPhotoUrl || !missionId) {
      return new Response(
        JSON.stringify({ error: 'submissionPhotoUrl et missionId requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Récupérer les images de référence pour cette mission
    const { data: referenceImages, error: refError } = await supabaseClient
      .from('mission_reference_images')
      .select('image_url')
      .eq('mission_id', missionId);

    if (refError) {
      console.error('Erreur récupération images de référence:', refError);
      return new Response(
        JSON.stringify({ error: 'Erreur récupération images de référence', validated: false }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Si pas d'images de référence, retourner non validé automatiquement
    if (!referenceImages || referenceImages.length === 0) {
      console.log('Pas d\'images de référence pour cette mission');
      return new Response(
        JSON.stringify({
          validated: false,
          similarityScore: 0,
          reason: 'Aucune image de référence configurée'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer le seuil de validation pour cette mission
    const { data: missionConfig } = await supabaseClient
      .from('mission_configs')
      .select('auto_validation_threshold, auto_validation_enabled')
      .eq('mission_id', missionId)
      .single();

    const autoValidationEnabled = missionConfig?.auto_validation_enabled ?? false;
    const threshold = missionConfig?.auto_validation_threshold ?? 0.7;

    if (!autoValidationEnabled) {
      console.log('Validation automatique désactivée pour cette mission');
      return new Response(
        JSON.stringify({
          validated: false,
          similarityScore: 0,
          reason: 'Validation automatique désactivée'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Utiliser Lovable AI pour comparer les images
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY non configuré');
      return new Response(
        JSON.stringify({ error: 'Configuration API manquante', validated: false }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Pour chaque image de référence, demander à l'IA de comparer
    let maxSimilarity = 0;
    let bestMatch = '';

    for (const refImage of referenceImages) {
      const prompt = `Analyse ces deux images et dis-moi si elles montrent le même sujet, lieu ou objet.
      
Image de référence attendue : ${refImage.image_url}
Image soumise par l'utilisateur : ${submissionPhotoUrl}

Réponds UNIQUEMENT par un score de similarité entre 0 et 1, où :
- 1.0 = images identiques ou presque identiques (même sujet, même angle)
- 0.8-0.9 = même sujet principal visible, angles légèrement différents
- 0.6-0.7 = même lieu ou objet mais différences notables
- 0.4-0.5 = sujet similaire mais contexte différent
- 0.0-0.3 = sujets différents

Réponds seulement avec le nombre (ex: 0.85)`;

      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: refImage.image_url } },
                  { type: 'image_url', image_url: { url: submissionPhotoUrl } }
                ]
              }
            ],
            max_tokens: 50
          }),
        });

        if (aiResponse.status === 429) {
          console.error('Rate limit atteint pour Lovable AI');
          continue;
        }

        if (aiResponse.status === 402) {
          console.error('Crédits Lovable AI épuisés');
          return new Response(
            JSON.stringify({ error: 'Crédits AI épuisés', validated: false }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!aiResponse.ok) {
          console.error('Erreur API Lovable AI:', aiResponse.status);
          continue;
        }

        const aiData = await aiResponse.json();
        const aiText = aiData.choices?.[0]?.message?.content || '0';
        const similarity = parseFloat(aiText.trim());

        console.log(`Similarité calculée: ${similarity} pour ${refImage.image_url}`);

        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          bestMatch = refImage.image_url;
        }
      } catch (error) {
        console.error('Erreur lors de la comparaison:', error);
      }
    }

    const validated = maxSimilarity >= threshold;

    console.log(`Validation finale: ${validated} (score: ${maxSimilarity}, seuil: ${threshold})`);

    return new Response(
      JSON.stringify({
        validated,
        similarityScore: maxSimilarity,
        bestMatch,
        threshold,
        reason: validated 
          ? 'Image validée automatiquement' 
          : 'Similarité insuffisante - validation manuelle requise'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erreur dans validate-photo:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error', 
        validated: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
