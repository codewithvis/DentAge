export interface DentalAgeResult {
  estimated_age: number;
  age_range: string;
  confidence: number;
  tooth_development_stage: string;
  analysis: string;
}

export const validateDentalAgeResult = (data: any): DentalAgeResult => {
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

  return data as DentalAgeResult;
};
