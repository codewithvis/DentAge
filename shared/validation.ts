export interface ToothData {
  stage: string;
  confidence: number;
}

export interface DentalAgeResult {
  estimated_age: number;
  age_range: string;
  confidence: number;
  teeth: {
    central_incisor: ToothData;
    lateral_incisor: ToothData;
    canine: ToothData;
    first_premolar: ToothData;
    second_premolar: ToothData;
    first_molar: ToothData;
    second_molar: ToothData;
  };
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
  if (!data.teeth || typeof data.teeth !== 'object') {
    errors.push("teeth must be an object");
  } else {
    const requiredTeeth = ['central_incisor', 'lateral_incisor', 'canine', 'first_premolar', 'second_premolar', 'first_molar', 'second_molar'];
    for (const tooth of requiredTeeth) {
      if (!data.teeth[tooth] || typeof data.teeth[tooth] !== 'object') {
        errors.push(`Missing data for tooth: ${tooth}`);
      } else {
        const { stage, confidence } = data.teeth[tooth];
        if (!stage || !['A','B','C','D','E','F','G','H','unknown'].includes(stage)) {
          errors.push(`Invalid stage for ${tooth}: ${stage}`);
        }
        if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
          errors.push(`Invalid confidence for ${tooth}: ${confidence}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Gemini output validation failed:\n${errors.join("\n")}`);
  }

  return data as DentalAgeResult;
};
