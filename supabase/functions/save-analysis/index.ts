// supabase/functions/save-analysis/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      case_id,
      patient_id,
      image_url,
      dental_age,
      ai_confidence,
      maturity_score,
      age_range,
      tooth_development_stage,
      analysis
    } = await req.json();

    // Insert into analyses table
    const { data, error } = await supabase
      .from('analyses')
      .insert({
        case_id,
        patient_id,
        image_url,
        dental_age,
        ai_confidence,
        maturity_score,
        age_range,
        tooth_development_stage,
        analysis,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({
      success: true,
      analysis: data[0]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});