// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GEMINI_SYSTEM_PROMPT = `You are a dental radiology AI specialized in forensic and clinical age estimation using OPG radiographs.

Return ONLY valid JSON:

{
  "estimated_age": number,
  "age_range": "min-max",
  "confidence": number,
  "tooth_development_stage": "string",
  "analysis": "string"
}`;

const MODEL = "gemini-1.5-flash";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64 || typeof imageBase64 !== "string") {
      throw new Error("Valid base64 image is required.");
    }

    // ✅ Clean base64
    const cleanBase64 = imageBase64.replace(
      /^data:image\/\w+;base64,/,
      ""
    );

    const API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!API_KEY) throw new Error("Missing GEMINI_API_KEY");

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

    const ENDPOINT = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${API_KEY}`;

    // ✅ Retry logic
    let response;
    let attempts = 0;

    while (attempts < 3) {
      try {
        response = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) break;
      } catch (err) {}

      attempts++;
      await new Promise((res) => setTimeout(res, 500 * attempts));
    }

    if (!response || !response.ok) {
      const text = response ? await response.text() : "No response";
      throw new Error(`Gemini API failed: ${text}`);
    }

    const data = await response.json();

    // ✅ Check candidates
    if (!data?.candidates?.length) {
      throw new Error(
        "No candidates returned (possibly blocked or invalid image)."
      );
    }

    // ✅ Extract text
    const parts = data.candidates[0]?.content?.parts || [];
    const rawText = parts.map((p: any) => p.text || "").join("").trim();

    // 🔥 DEBUG 1: RAW RESPONSE
    console.log("RAW GEMINI OUTPUT:", rawText);

    if (!rawText) {
      throw new Error("Empty response from Gemini.");
    }

    // ✅ Clean markdown
    let cleaned = rawText.replace(/```json|```/g, "").trim();

    // 🔥 DEBUG 2: CLEANED RESPONSE
    console.log("CLEANED OUTPUT:", cleaned);

    const match = cleaned.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("Invalid JSON format returned by Gemini.");
    }

    let parsed;
    try {
      parsed = JSON.parse(match[0]);

      // 🔥 DEBUG 3: PARSED JSON
      console.log("PARSED OUTPUT:", parsed);

    } catch (e) {
      throw new Error("Failed to parse Gemini JSON output.");
    }

    // ✅ Validate structure
    if (
      typeof parsed.estimated_age !== "number" ||
      typeof parsed.confidence !== "number"
    ) {
      throw new Error("Invalid AI response structure.");
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error occurred";

    console.error("Edge Function Error:", message);

    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});