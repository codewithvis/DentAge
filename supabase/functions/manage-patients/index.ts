// supabase/functions/manage-patients/index.ts
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

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const patientId = url.searchParams.get('id');

      if (patientId) {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('id', patientId)
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          patient: data
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } else {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          patients: data
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    if (req.method === 'POST') {
      const { name, date_of_birth, notes } = await req.json();

      const { data, error } = await supabase
        .from('patients')
        .insert({
          name,
          date_of_birth,
          notes,
          created_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        patient: data[0]
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});