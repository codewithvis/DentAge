// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const validateTeethData = (data: any) => {
  const errors: string[] = [];

  if (typeof data.estimated_age !== "number" || data.estimated_age < 0) {
    errors.push("estimated_age must be a non-negative number");
  }
  if (typeof data.age_range !== "string" || !/^\d+-\d+$/.test(data.age_range)) {
    errors.push('age_range must be a string in "min-max" format');
  }
  if (!data.teeth || typeof data.teeth !== 'object') {
    errors.push("teeth must be an object");
  } else {
    const requiredTeeth = ['central_incisor', 'lateral_incisor', 'canine', 'first_premolar', 'second_premolar', 'first_molar', 'second_molar'];
    for (const tooth of requiredTeeth) {
      if (!data.teeth[tooth] || typeof data.teeth[tooth] !== 'object') {
        errors.push(`Missing data for tooth: ${tooth}`);
      } else {
        const { stage, confidence } = data.teeth[tooth];
        if (!stage || !['A','B','C','D','E','F','G','H','unknown'].includes(stage)) {
          errors.push(`Invalid stage for ${tooth}: ${stage}`);
        }
        if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
          errors.push(`Invalid confidence for ${tooth}: ${confidence}`);
        }
      }
    }
  }

  if (typeof data.confidence !== "number" || data.confidence < 0 || data.confidence > 1) {
    errors.push("confidence must be a number between 0 and 1");
  }

  if (errors.length > 0) {
    throw new Error(`AI output validation failed:\n${errors.join("\n")}`);
  }

  return data;
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { ai_result, case_id, patient_id } = body;

    if (!ai_result) {
      throw new Error("Missing 'ai_result' in request body.");
    }

    // Validate the AI result
    const validData = validateTeethData(ai_result);

    // Create a maturity score based on dental age (simplified approach)
    // This represents overall dental maturation on a scale of 0-100
    const maturityScore = Math.min(100, Math.max(0, (validData.estimated_age / 18) * 100));

    // FINAL ANALYSIS PIPELINE
    const resultPayload = {
      case_id: case_id || `CASE-${Date.now()}`,
      patient_id: patient_id || "null",
      dental_age: validData.estimated_age,
      ai_confidence: validData.confidence,
      maturity_score: Number(maturityScore.toFixed(2)),
      age_range: validData.age_range,
      teeth_stages: validData.teeth,
      analysis: `Age estimated from Demirjian stages of 7 mandibular left teeth.`
    };

    return new Response(JSON.stringify(resultPayload), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error("Age Calculation Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
