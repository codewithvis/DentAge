// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_SYSTEM_PROMPT = `You are a dental radiology AI specialized in forensic and clinical age estimation using OPG (orthopantomogram) radiographs.

TASK:
Analyze the provided full OPG image and determine the Demirjian development stages for the 7 mandibular left permanent teeth used in age estimation. Then estimate the dental age based on these stages.

ANALYZE THESE 7 TEETH:
1. Central incisor (tooth 31)
2. Lateral incisor (tooth 32)
3. Canine (tooth 33)
4. First premolar (tooth 34)
5. Second premolar (tooth 35)
6. First molar (tooth 36)
7. Second molar (tooth 37)

RULES:
- Use Demirjian stages A through H for each tooth
- Base stages strictly on observable dental structures in the radiograph
- Estimate age using standard Demirjian age tables for the stage combination
- If a tooth is not visible or unclear, use stage "unknown" for that tooth
- Do NOT assume, infer, or require patient gender
- Do NOT guess or fabricate stages
- If the image is not a valid OPG, set all stages to "unknown", confidence to 0.0, and estimated_age to 0

OUTPUT FORMAT:
Return ONLY a valid JSON object — no markdown, no code fences, no commentary outside the JSON:

{
  "estimated_age": <number in years>,
  "age_range": "<min>-<max>",
  "confidence": <overall confidence 0.0-1.0>,
  "teeth": {
    "central_incisor": {"stage": "A-H or unknown", "confidence": 0.0-1.0},
    "lateral_incisor": {"stage": "A-H or unknown", "confidence": 0.0-1.0},
    "canine": {"stage": "A-H or unknown", "confidence": 0.0-1.0},
    "first_premolar": {"stage": "A-H or unknown", "confidence": 0.0-1.0},
    "second_premolar": {"stage": "A-H or unknown", "confidence": 0.0-1.0},
    "first_molar": {"stage": "A-H or unknown", "confidence": 0.0-1.0},
    "second_molar": {"stage": "A-H or unknown", "confidence": 0.0-1.0}
  }
}`;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // STEP 1 — Validate Incoming Request
    const body = await req.json();
    console.log("STEP 1: Incoming request body:", body);

    const { image, user_id, patient_id = 1 } = body;

    if (!image || !user_id) {
      return new Response(JSON.stringify({
        step: "validation",
        error: "Missing required fields",
        received: body
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // STEP 2 — Validate Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        step: "auth",
        error: "Missing authorization header"
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("STEP 2: Auth user:", user, authError);

    if (!user || authError) {
      return new Response(JSON.stringify({
        step: "auth",
        error: "User not authenticated",
        authError
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // STEP 3 — Validate Image Processing
    console.log("STEP 3: Image received:", {
      exists: !!image,
      length: image?.length,
      type: typeof image
    });

    if (!image || (typeof image !== 'string' && !(image instanceof Uint8Array))) {
      return new Response(JSON.stringify({
        step: "image_validation",
        error: "Invalid or missing image"
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prepare image for processing and Gemini
    let base64Data: string;
    let imageBuffer: Uint8Array;

    if (typeof image === 'string') {
      // Handle base64 string
      base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const binaryString = atob(base64Data);
      imageBuffer = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        imageBuffer[i] = binaryString.charCodeAt(i);
      }
    } else {
      // Handle Uint8Array directly
      imageBuffer = image;
      base64Data = btoa(String.fromCharCode(...imageBuffer));
    }

    // STEP 4 — Gemini API Call
    try {
      console.log("STEP 4: Calling Gemini API");

      const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
      if (!GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured in environment variables.");
      }

      const requestBody = {
        contents: [
          {
            parts: [
              { text: GEMINI_SYSTEM_PROMPT },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE"
          }
        ]
      };

      const MODEL = "gemini-2.5-flash";
      const ENDPOINT = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

      const geminiResponse = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!geminiResponse.ok) {
        const errorBody = await geminiResponse.text();
        throw new Error(`Gemini API returned HTTP ${geminiResponse.status}: ${errorBody}`);
      }

      const geminiData = await geminiResponse.json();
      console.log("STEP 4: Gemini response received, candidates:", geminiData?.candidates?.length);

      // Extract and parse Gemini response
      const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error("Gemini API returned no text content in the response.");
      }

      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error(`Invalid AI response format: no JSON found. Raw Gemini output: ${rawText}`);
      }

      let parsedAnalysis;
      try {
        parsedAnalysis = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        throw new Error("Failed to parse JSON from Gemini response.");
      }

      // Validate analysis structure
      if (typeof parsedAnalysis.estimated_age !== "number" || parsedAnalysis.estimated_age < 0) {
        throw new Error("Invalid estimated_age in AI response.");
      }
      if (typeof parsedAnalysis.age_range !== "string" || !/^\d+-\d+$/.test(parsedAnalysis.age_range)) {
        throw new Error("Invalid age_range in AI response.");
      }
      if (!parsedAnalysis.teeth || typeof parsedAnalysis.teeth !== 'object') {
        throw new Error("Missing or invalid teeth data in AI response.");
      }

      const requiredTeeth = ['central_incisor', 'lateral_incisor', 'canine', 'first_premolar', 'second_premolar', 'first_molar', 'second_molar'];
      for (const tooth of requiredTeeth) {
        if (!parsedAnalysis.teeth[tooth] || typeof parsedAnalysis.teeth[tooth] !== 'object') {
          throw new Error(`Missing data for tooth: ${tooth}`);
        }
        const { stage, confidence } = parsedAnalysis.teeth[tooth];
        if (!stage || !['A','B','C','D','E','F','G','H','unknown'].includes(stage)) {
          throw new Error(`Invalid stage for ${tooth}: ${stage}`);
        }
        if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
          throw new Error(`Invalid confidence for ${tooth}: ${confidence}`);
        }
      }

      if (typeof parsedAnalysis.confidence !== 'number' || parsedAnalysis.confidence < 0 || parsedAnalysis.confidence > 1) {
        throw new Error("Invalid overall confidence in AI response.");
      }

      console.log("STEP 4: Gemini analysis completed successfully");

      // STEP 5 — Database / Storage (RLS CHECK)
      console.log("STEP 5: Attempting DB insert");

      try {
        // Generate unique filename
        const fileName = `radiograph_${user.id}_${Date.now()}.png`;

        // Upload to Supabase Storage
        const { data: storageData, error: uploadError } = await supabase.storage
          .from('opg-images') // FIXED BUCKET
          .upload(fileName, imageBuffer, {
            contentType: 'image/png',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        // Get public URL
        const { data: publicData } = supabase.storage.from('opg-images').getPublicUrl(fileName); // FIXED BUCKET

        // Calculate a basic maturity score
        const maturityScore = Math.min(100, Math.max(0, (parsedAnalysis.estimated_age / 18) * 100));

        // Insert analysis record directly - removed radiographs insert as table doesn't exist
        const { data: analysisData, error: analysisInsertError } = await supabase
          .from('analyses')
          .insert({
            case_id: `CASE-${Date.now()}`,
            patient_id: patient_id === 1 ? null : patient_id, // Defaulted 1 -> null
            image_url: publicData.publicUrl,
            dental_age: parsedAnalysis.estimated_age,
            ai_confidence: parsedAnalysis.confidence,
            maturity_score: Number(maturityScore.toFixed(2)),
            age_range: parsedAnalysis.age_range,
            tooth_development_stage: JSON.stringify(parsedAnalysis.teeth),
            analysis: "Age estimated from Demirjian stages of 7 mandibular left teeth.",
            user_id: user.id
          })
          .select()
          .single();

        if (analysisInsertError) {
          throw new Error(`Analysis insert failed: ${analysisInsertError.message}`);
        }

        console.log("STEP 5: Database operations completed successfully");

        // STEP 6 — Final Response
        return new Response(JSON.stringify({
          success: true,
          message: "Analysis completed successfully",
          data: {
            analysis: analysisData,
            ai_result: parsedAnalysis
          }
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (dbError: any) {
        console.error("STEP 5 ERROR:", dbError);
        return new Response(JSON.stringify({
          step: "database",
          error: dbError.message,
          details: dbError
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

    } catch (geminiError: any) {
      console.error("STEP 4 ERROR:", geminiError);
      return new Response(JSON.stringify({
        step: "gemini",
        error: geminiError.message,
        details: geminiError
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({
      step: "unknown",
      error: error.message || "Unexpected error occurred",
      details: error
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
