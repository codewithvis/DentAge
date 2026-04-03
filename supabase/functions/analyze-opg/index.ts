// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { imageBase64, debug } = await req.json();

    console.log("Incoming request - imageBase64 length:", imageBase64?.length);

    if (!imageBase64 || typeof imageBase64 !== "string") {
      throw new Error("A valid base64-encoded image string is required.");
    }

    // Clean base64: remove data:image/... prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    console.log("Cleaned base64 length:", cleanBase64.length);

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
                data: cleanBase64,
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
      },
    };

    const MODEL = "gemini-1.5-flash";
    const ENDPOINT = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    let response;
    try {
      response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
    } catch (networkError) {
      throw new Error(`Network error calling Gemini API: ${networkError.message}`);
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API returned HTTP ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    console.log("Gemini response received, candidates:", data?.candidates?.length);

    // Extract text from Gemini response structure
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("Gemini API returned no text content in the response.");
    }

    // Extract JSON from text
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid AI response format: no JSON found in Gemini output.");
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      throw new Error("Failed to parse JSON from Gemini response.");
    }

    // Validate structure
    if (typeof parsed.estimated_age !== "number" || parsed.estimated_age < 0) {
      throw new Error("Invalid estimated_age in AI response.");
    }
    if (typeof parsed.age_range !== "string" || !/^\d+-\d+$/.test(parsed.age_range)) {
      throw new Error("Invalid age_range in AI response.");
    }
    if (!parsed.teeth || typeof parsed.teeth !== 'object') {
      throw new Error("Missing or invalid teeth data in AI response.");
    }

    const requiredTeeth = ['central_incisor', 'lateral_incisor', 'canine', 'first_premolar', 'second_premolar', 'first_molar', 'second_molar'];
    for (const tooth of requiredTeeth) {
      if (!parsed.teeth[tooth] || typeof parsed.teeth[tooth] !== 'object') {
        throw new Error(`Missing data for tooth: ${tooth}`);
      }
      const { stage, confidence } = parsed.teeth[tooth];
      if (!stage || !['A','B','C','D','E','F','G','H','unknown'].includes(stage)) {
        throw new Error(`Invalid stage for ${tooth}: ${stage}`);
      }
      if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
        throw new Error(`Invalid confidence for ${tooth}: ${confidence}`);
      }
    }

    if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
      throw new Error("Invalid overall confidence in AI response.");
    }

    if (debug) {
      return new Response(JSON.stringify({ raw_gemini_response: rawText, parsed }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error("Analysis Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
