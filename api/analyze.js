import { supabase } from '../services/supabase';

/**
 * Upload and analyze OPG radiograph with full error logging
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} userId - User ID for authentication
 * @returns {Promise<any>}
 */
export const analyzeOPG = async (imageBase64, userId) => {
  try {
    // Get the current session first
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    console.log("Current session status:", currentSession ? "active" : "none");
    
    // Force session refresh to ensure we have a valid token
    const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
    
    if (sessionError || !session) {
      console.error("Session refresh failed:", sessionError);
      throw new Error("Authentication failed. Please log in again.");
    }

    const token = session.access_token;
    
    if (!token) {
      throw new Error("No access token available. Please log in again.");
    }

    console.log("Making API call with fresh token to radiograph_upload_and_analyze");
    console.log("User ID:", userId);
    console.log("Image data length:", imageBase64?.length);
    console.log("Token prefix:", token.substring(0, 20) + "...");
    
    // Decode JWT to check expiry and claims
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')));
        console.log("Token payload:", {
          exp: payload.exp,
          iat: payload.iat,
          sub: payload.sub,
          role: payload.role,
          expiresIn: payload.exp ? (payload.exp - Math.floor(Date.now() / 1000)) : 'unknown'
        });
      }
    } catch (e) {
      console.warn("Could not decode token:", e);
    }

    // Test if we can make a simple database query with this token
    console.log("Testing token with a simple database query...");
    const { data: testData, error: testError } = await supabase.from('analyses').select('id').limit(1);
    if (testError) {
      console.error("Database query test failed:", testError);
    } else {
      console.log("Database query test succeeded - token is valid for DB queries");
    }

    // Try direct HTTP call - use ANON KEY as authorization for edge functions
    const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    const functionUrl = `${SUPABASE_URL}/functions/v1/radiograph_upload_and_analyze`;
    
    console.log("Calling function URL:", functionUrl);
    console.log("Attempting with anon key instead of user token...");
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'x-user-token': token, // Pass user token as custom header
      },
      body: JSON.stringify({
        image: imageBase64,
        user_id: userId,
        user_token: token, // Also include in body
      }),
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("EDGE FUNCTION ERROR:", {
        status: response.status,
        statusText: response.statusText,
        errorData,
      });

      const detail = errorData.error || errorData.message || 'Failed to upload and analyze OPG image';
      const step = errorData.step || 'unknown';
      
      // If it's an auth error, give user a clearer message
      if (step === 'auth' || detail.includes('JWT') || detail.includes('authentication')) {
        throw new Error('Your session has expired. Please log out and log back in.');
      }
      
      throw new Error(`[${step}] ${detail}`);
    }

    const data = await response.json();
    console.log("SERVER RESPONSE:", data);
    return data;
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
  // Refresh session here too
  const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
  
  if (sessionError || !session) {
    throw new Error("Authentication failed. Please log in again.");
  }

  const res = await supabase.functions.invoke('calculate-age', {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
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