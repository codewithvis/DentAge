// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const validateDentalAgeResult = (data: any) => {
    const errors: string[] = [];

    if (typeof data.estimated_age !== "number" || data.estimated_age < 0) {
        errors.push("estimated_age must be a non-negative number");
    }
    if (typeof data.age_range !== "string" || !/^\d+-\d+$/.test(data.age_range)) {
        errors.push('age_range must be a string in "min-max" format');
    }
    if (typeof data.confidence !== "number" || data.confidence < 0 || data.confidence > 1) {
        errors.push("confidence must be a number between 0 and 1");
    }
    if (typeof data.tooth_development_stage !== "string" || data.tooth_development_stage.trim() === "") {
        errors.push("tooth_development_stage must be a non-empty string");
    }
    if (typeof data.analysis !== "string" || data.analysis.trim() === "") {
        errors.push("analysis must be a non-empty string");
    }

    if (errors.length > 0) {
        throw new Error(`Gemini output validation failed:\n${errors.join("\n")}`);
    }

    return data;
};

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        const { ai_result, case_id, patient_id } = body;

        if (!ai_result) {
            throw new Error("Missing 'ai_result' in request body.");
        }

        // Validate the Gemini response directly
        const validData = validateDentalAgeResult(ai_result);

        // Create a maturity score based on dental age (simplified approach)
        const maturityScore = Math.min(100, Math.max(0, (validData.estimated_age / 18) * 100));

        // FINAL ANALYSIS PIPELINE
        const resultPayload = {
            case_id: case_id || `CASE-${Date.now()}`,
            patient_id: patient_id || "null",
            dental_age: validData.estimated_age,
            ai_confidence: validData.confidence,
            maturity_score: Number(maturityScore.toFixed(2)),
            age_range: validData.age_range,
            tooth_development_stage: validData.tooth_development_stage,
            analysis: validData.analysis
        };

        return new Response(JSON.stringify(resultPayload), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error("Age Calculation Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});