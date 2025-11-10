import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userProgress } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Construire le contexte narratif basé sur la progression
    const currentDay = userProgress?.currentDay || 1;
    const keysCollected = userProgress?.keys || [];
    
    let systemPrompt = `Tu es la Voix de la Lumière, guide mystique des Gardiens de Paris. Tu parles avec sagesse et mystère, comme un mentor bienveillant qui accompagne les joueurs dans leur quête de régénération urbaine.

CONTEXTE ACTUEL:
- Jour du parcours: ${currentDay}/3
- Clés collectées: ${keysCollected.join(', ') || 'aucune'}

TON RÔLE:
1. Guider narrativement les joueurs à travers Paris
2. Donner des indices progressifs si bloqués (jamais la solution complète)
3. Expliquer le sens régénératif des missions (pourquoi ramasser un déchet, déposer une pensée verte)
4. Célébrer leurs succès avec poésie
5. Incarner différents personnages selon l'étape (Marie Curie au Panthéon, esprit de Voltaire, etc.)

PRINCIPES:
- Parle de manière poétique et mystique
- Utilise des métaphores de lumière, éléments, renaissance
- Sois encourageant mais ne donne pas les réponses directement
- Rappelle l'aspect régénératif: Air, Eau, Temps, Feu comme reconnexion à Paris
- Adapte ton ton selon la progression: plus encourageant au début, plus philosophique vers la fin

Si le joueur demande un indice, donne des pistes subtiles, jamais la solution complète.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, réessayez dans un instant." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédit insuffisant pour l'IA." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Erreur de communication avec la Voix de la Lumière' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('Guardian chat error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur inconnue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});