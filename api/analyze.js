import { supabase } from '../services/supabase';

/**
 * Upload Base64 OPG to Gemini Edge Function for analysis
 * @param {string} imageBase64 
 * @returns {Promise<any>}
 */
export const analyzeOPG = async (imageBase64) => {
  const res = await supabase.functions.invoke('analyze-opg', {
    body: { imageBase64 },
  });

  if (res.error) {
    throw new Error(res.error.message || 'Failed to analyze OPG image');
  }

  return res.data;
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
