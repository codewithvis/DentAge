// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_SYSTEM_PROMPT = `You are a dental radiology AI specialized in forensic and clinical age estimation using OPG (orthopantomogram) radiographs.

TASK:
Analyze the provided full OPG image and estimate the patient's dental age based exclusively on observable dental structures.

ANALYSIS CRITERIA:
- Tooth development stages (mineralization, root formation, apical closure)
- Eruption sequence and status (erupted, erupting, unerupted)
- Third molar (wisdom tooth) development
- Root resorption patterns (if deciduous teeth are present)
- Overall dental maturity indicators

RULES:
- Do NOT assume, infer, or require patient gender
- Do NOT guess or fabricate data
- Base ALL reasoning strictly on what is visually evident in the radiograph
- Use Demirjian classification stages (A through H) where applicable
- If the image is unclear or not a valid OPG, state this in the analysis field and set confidence to 0.0

OUTPUT FORMAT:
Return ONLY a valid JSON object — no markdown, no code fences, no commentary outside the JSON:

{
  "estimated_age": <number in years>,
  "age_range": "<min>-<max>",
  "confidence": <float between 0 and 1>,
  "tooth_development_stage": "<Demirjian stage or descriptive>",
  "analysis": "<brief technical explanation citing specific dental evidence>"
}`;

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { imageBase64 } = await req.json();

        if (!imageBase64 || typeof imageBase64 !== "string") {
            throw new Error("A valid base64-encoded image string is required.");
        }

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
                                data: imageBase64,
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

        // Extract text from Gemini response structure
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidateText) {
            throw new Error("Gemini API returned no text content in the response.");
        }

        const parsed = JSON.parse(candidateText);

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