import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { photoUrl, validationPrompt, missionId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Validating photo for mission ${missionId}`);

    // Call Lovable AI with vision capabilities
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Tu es un validateur d'images pour un jeu de piste à Paris. 
            Tu dois analyser les photos et déterminer si elles correspondent aux critères demandés.
            Réponds UNIQUEMENT par un JSON avec cette structure:
            {
              "valid": true/false,
              "reason": "explication courte en français",
              "confidence": 0-100
            }`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: validationPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: photoUrl
                }
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'rate_limit',
            message: 'Trop de requêtes, veuillez réessayer dans quelques instants.' 
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'insufficient_credits',
            message: 'Crédits insuffisants pour la validation.' 
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI validation failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI validation response:', aiResponse);

    // Parse AI response
    let validationResult;
    try {
      validationResult = JSON.parse(aiResponse);
    } catch (e) {
      // If AI didn't return valid JSON, extract info from text
      const valid = aiResponse.toLowerCase().includes('valid') && 
                   !aiResponse.toLowerCase().includes('non valid') &&
                   !aiResponse.toLowerCase().includes('invalide');
      validationResult = {
        valid,
        reason: aiResponse.substring(0, 200),
        confidence: valid ? 70 : 30
      };
    }

    return new Response(
      JSON.stringify(validationResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in validate-photo function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        valid: false,
        reason: 'Erreur lors de la validation'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
