import { supabase } from '../services/supabase';

/**
 * Upload and analyze OPG radiograph with full error logging
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} userId - User ID for authentication
 * @returns {Promise<any>}
 */
export const analyzeOPG = async (imageBase64, userId) => {
  try {
    const res = await supabase.functions.invoke('radiograph_upload_and_analyze', {
      body: {
        image: imageBase64,
        user_id: userId
      },
    });

    if (res.error) {
      console.log("CLIENT ERROR FULL:", res.error);
      throw new Error(res.error.message || 'Failed to upload and analyze OPG image');
    }

    console.log("SERVER RESPONSE:", res.data);
    return res.data;
  } catch (err) {
    console.log("CLIENT ERROR FULL:", err);
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
