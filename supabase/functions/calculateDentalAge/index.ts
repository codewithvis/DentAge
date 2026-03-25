// supabase/functions/calculateDentalAge/index.ts

// @ts-ignore: Deno imports are not natively recognized by the project's tsconfig
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SCORES = {
  male: {
    '37': { A: 0.0, B: 2.1, C: 3.5, D: 5.9, E: 10.1, F: 12.5, G: 13.2, H: 13.6 },
    '36': { A: 0.0, B: 0.0, C: 0.0, D: 0.0, E: 4.0,  F: 6.8,  G: 12.0, H: 16.2 },
    '35': { A: 0.0, B: 1.7, C: 3.1, D: 5.4, E: 9.7,  F: 12.0, G: 12.8, H: 13.2 },
    '34': { A: 0.0, B: 0.0, C: 2.0, D: 3.6, E: 7.9,  F: 10.0, G: 10.6, H: 11.0 },
    '33': { A: 0.0, B: 0.0, C: 0.0, D: 0.0, E: 3.5,  F: 5.3,  G: 7.2,  H: 8.8  },
    '32': { A: 0.0, B: 0.0, C: 0.0, D: 0.0, E: 3.2,  F: 4.5,  G: 6.2,  H: 7.9  },
    '31': { A: 0.0, B: 0.0, C: 0.0, D: 0.0, E: 3.2,  F: 4.4,  G: 6.0,  H: 7.7  },
  },
  female: {
    '37': { A: 0.0, B: 2.7, C: 3.9, D: 6.9, E: 11.1, F: 13.5, G: 14.2, H: 14.5 },
    '36': { A: 0.0, B: 0.0, C: 0.0, D: 0.0, E: 4.5,  F: 7.6,  G: 13.0, H: 15.6 },
    '35': { A: 0.0, B: 1.8, C: 3.4, D: 6.5, E: 10.6, F: 12.7, G: 13.5, H: 13.8 },
    '34': { A: 0.0, B: 0.0, C: 2.1, D: 4.0, E: 8.7,  F: 10.7, G: 11.4, H: 11.8 },
    '33': { A: 0.0, B: 0.0, C: 0.0, D: 0.0, E: 3.6,  F: 5.6,  G: 7.5,  H: 9.3  },
    '32': { A: 0.0, B: 0.0, C: 0.0, D: 0.0, E: 3.2,  F: 4.6,  G: 6.3,  H: 8.2  },
    '31': { A: 0.0, B: 0.0, C: 0.0, D: 0.0, E: 3.2,  F: 4.6,  G: 6.3,  H: 8.2  },
  }
};

const TEETH = ['31', '32', '33', '34', '35', '36', '37'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { gender, stages, patient_id } = body;

    // Validation Module
    if (!gender || (gender.toLowerCase() !== 'male' && gender.toLowerCase() !== 'female')) {
      throw new Error("Invalid or missing 'gender'. Must be 'male' or 'female'.");
    }
    
    if (!stages || typeof stages !== 'object') {
      throw new Error("Missing or invalid 'stages' object.");
    }

    const missingTeeth = TEETH.filter(t => !stages[t]);
    if (missingTeeth.length > 0) {
      throw new Error(`Missing stages for teeth: ${missingTeeth.join(', ')}. All 7 left mandibular teeth required.`);
    }

    const g = gender.toLowerCase();
    let totalScore = 0;
    const table: any = SCORES[g as keyof typeof SCORES];

    for (const t of TEETH) {
      const stageStr = stages[t].toUpperCase();
      if (['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].indexOf(stageStr) === -1) {
          throw new Error(`Invalid stage '${stageStr}' for tooth ${t}`);
      }
      totalScore += table[t][stageStr];
    }
    
    totalScore = Number(totalScore.toFixed(1));

    // Convert Score -> Dental Age based on generalized Demirjian formula mapping
    let dentalAge = 0;
    if (g === 'male') {
      // Very basic linear map for demo purposes: Needs standard 100-percentile table in full prod
      dentalAge = 3.0 + (totalScore * 0.12); 
    } else {
      dentalAge = 3.0 + (totalScore * 0.11);
    }
    dentalAge = Number(dentalAge.toFixed(1));

    // Section 2.6: EXTREMELY STRICT OUTPUT FORMAT
    const resultPayload = {
      patient_id: patient_id || "null",
      stages: stages,
      maturity_score: totalScore,
      dental_age: dentalAge
    };

    return new Response(JSON.stringify(resultPayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
