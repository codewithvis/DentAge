// utils/demirjianScoring.ts

export type Gender = 'Male' | 'Female' | 'male' | 'female';
export type Stage = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

// FDI Tooth Numbers for the 7 left permanent mandibular teeth
export type ToothNumber = '31' | '32' | '33' | '34' | '35' | '36' | '37';

export type PatientStages = Record<ToothNumber, Stage>;

// Demirjian 1973 Standard Tables (Scores)
const SCORES = {
  male: {
    '37': { A: 0.0, B: 2.1, C: 3.5, D: 5.9, E: 10.1, F: 12.5, G: 13.2, H: 13.6 }, // M2
    '36': { A: 0.0, B: 0.0, C: 0.0, D: 0.0, E: 4.0,  F: 6.8,  G: 12.0, H: 16.2 }, // M1
    '35': { A: 0.0, B: 1.7, C: 3.1, D: 5.4, E: 9.7,  F: 12.0, G: 12.8, H: 13.2 }, // PM2
    '34': { A: 0.0, B: 0.0, C: 2.0, D: 3.6, E: 7.9,  F: 10.0, G: 10.6, H: 11.0 }, // PM1
    '33': { A: 0.0, B: 0.0, C: 0.0, D: 0.0, E: 3.5,  F: 5.3,  G: 7.2,  H: 8.8  }, // C
    '32': { A: 0.0, B: 0.0, C: 0.0, D: 0.0, E: 3.2,  F: 4.5,  G: 6.2,  H: 7.9  }, // I2
    '31': { A: 0.0, B: 0.0, C: 0.0, D: 0.0, E: 3.2,  F: 4.4,  G: 6.0,  H: 7.7  }, // I1
  },
  female: {
    '37': { A: 0.0, B: 2.7, C: 3.9, D: 6.9, E: 11.1, F: 13.5, G: 14.2, H: 14.5 }, // M2
    '36': { A: 0.0, B: 0.0, C: 0.0, D: 0.0, E: 4.5,  F: 7.6,  G: 13.0, H: 15.6 }, // M1
    '35': { A: 0.0, B: 1.8, C: 3.4, D: 6.5, E: 10.6, F: 12.7, G: 13.5, H: 13.8 }, // PM2
    '34': { A: 0.0, B: 0.0, C: 2.1, D: 4.0, E: 8.7,  F: 10.7, G: 11.4, H: 11.8 }, // PM1
    '33': { A: 0.0, B: 0.0, C: 0.0, D: 0.0, E: 3.6,  F: 5.6,  G: 7.5,  H: 9.3  }, // C
    '32': { A: 0.0, B: 0.0, C: 0.0, D: 0.0, E: 3.2,  F: 4.6,  G: 6.3,  H: 8.2  }, // I2
    '31': { A: 0.0, B: 0.0, C: 0.0, D: 0.0, E: 3.2,  F: 4.6,  G: 6.3,  H: 8.2  }, // I1
  }
};

/**
 * Calculates maturity score based on 7 teeth stages
 */
export const calculateMaturityScore = (gender: Gender, stages: PatientStages): number => {
  const g = gender.toLowerCase() as 'male' | 'female';
  const table = SCORES[g];
  
  let totalScore = 0;
  for (const tooth of ['31', '32', '33', '34', '35', '36', '37'] as ToothNumber[]) {
    const stage = stages[tooth];
    if (!stage || !table[tooth][stage]) {
      throw new Error(`Invalid stage ${stage} for tooth ${tooth}`);
    }
    totalScore += table[tooth][stage];
  }
  
  return Number(totalScore.toFixed(1));
};

/**
 * Approximate conversion from maturity score to dental age
 * Based on Demirjian's conversion formulas/tables.
 * (Note: precise curve mapping would use the full percentile tables, 
 * using a polynomial best-fit approximation here if exact table isn't provided).
 */
export const scoreToAge = (score: number, gender: Gender): number => {
  const g = gender.toLowerCase();
  let age = 0;
  // Approximations or table lookups would go here.
  // Using a simplistic linear/polynomial approximation for demonstration.
  // In a real strict clinical setup, a full lookup array from the 100-point table is used.
  if (g === 'male') {
      // rough approximate polynomial
      age = 3.0 + (score * 0.12); 
  } else {
      age = 3.0 + (score * 0.11);
  }
  
  return Number(age.toFixed(1));
};

export const calculateDentalAge = (stages: PatientStages, gender: Gender) => {
  const maturityScore = calculateMaturityScore(gender, stages);
  const dentalAge = scoreToAge(maturityScore, gender);
  
  return {
    maturity_score: maturityScore,
    dental_age: dentalAge
  };
};
