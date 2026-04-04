import { supabase } from '../services/supabase';

/**
 * Upload and analyze OPG radiograph with full error logging
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} userId - User ID for authentication
 * @returns {Promise<any>}
 */
export const analyzeOPG = async (imageBase64, userId) => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    if (!token) {
        throw new Error("Local session access token is missing entirely before hitting analyze-opg. The user is logged out.");
    }
    
    console.log("Analyzing with token prefix:", token.substring(0, 20));

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://zmbsnhlvjjaaqyijuzhf.supabase.co';
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    const resRaw = await fetch(`${supabaseUrl}/functions/v1/radiograph_upload_and_analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        image: imageBase64,
        user_id: userId
      })
    });

    const serverError = await resRaw.json().catch(() => null);
    
    if (!resRaw.ok) {
      const detail = serverError?.error || serverError?.message || resRaw.statusText || 'Failed to upload and analyze OPG image';
      const step = serverError?.step || 'unknown';
      throw new Error(`[${step}] ${detail}`);
    }

    console.log("SERVER RESPONSE:", serverError);
    
    // Map the edge function's nested response into the flattened shape the frontend UI expects
    if (serverError && serverError.data) {
        return {
            ...serverError.data.ai_result,
            tooth_development_stage: serverError.data.analysis?.tooth_development_stage || JSON.stringify(serverError.data.ai_result?.teeth),
            analysis: serverError.data.analysis?.analysis || "Analysis completed based on Demirjian stages."
        };
    }
    
    return serverError;
  } catch (err) {
    console.error("ANALYZE OPG ERROR:", err.message || err);
    throw err;
  }
};

/**
 * Submit confirmed AI analysis to edge function to generate
 * clinical outputs and calculate the exact age and maturity.
 * @param {object} aiAnalysisResult - Complete AI analysis result from Gemini
 * @param {number|string} patient_id
 * @returns {Promise<any>}
 */
export const finalizeAnalysis = async (aiAnalysisResult, patient_id) => {
  const res = await supabase.functions.invoke('calculate-age', {
    body: {
      ai_result: aiAnalysisResult,
      patient_id,
    },
  });

  if (res.error) {
    throw new Error(res.error.message || 'Failed to finalize analysis');
  }

  return res.data;
};
