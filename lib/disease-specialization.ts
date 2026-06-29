export const DISEASE_SPEC_MAP: Record<string, string[]> = {
  cardiologist: ["Cardiologist"],
  heart: ["Cardiologist"],
  cardiac: ["Cardiologist"],
  hypertension: ["Cardiologist", "General Physician"],
  stroke: ["Neurologist", "Cardiologist"],
  migraine: ["Neurologist"],
  headache: ["Neurologist", "General Physician"],
  paralysis: ["Neurologist"],
  epilepsy: ["Neurologist"],
  alzheimer: ["Neurologist"],
  dementia: ["Neurologist"],
  parkinson: ["Neurologist"],

  acne: ["Dermatologist"],
  rosacea: ["Dermatologist"],
  rash: ["Dermatologist"],
  dermatitis: ["Dermatologist"],
  eczema: ["Dermatologist"],
  psoriasis: ["Dermatologist"],
  melanoma: ["Dermatologist", "General Physician"],
  mole: ["Dermatologist"],
  skin: ["Dermatologist"],
  fungal: ["Dermatologist"],
  ringworm: ["Dermatologist"],
  wart: ["Dermatologist"],
  urticaria: ["Dermatologist"],

  asthma: ["Pulmonologist"],
  bronchitis: ["Pulmonologist"],
  pneumonia: ["Pulmonologist", "General Physician"],
  cough: ["Pulmonologist", "General Physician"],
  tuberculosis: ["Pulmonologist"],
  lung: ["Pulmonologist"],

  diarrhea: ["Gastroenterologist"],
  vomiting: ["Gastroenterologist"],
  abdominal: ["Gastroenterologist"],
  gastroenteritis: ["Gastroenterologist"],
  stomach: ["Gastroenterologist"],
  ulcer: ["Gastroenterologist"],
  hepatitis: ["Gastroenterologist"],
  jaundice: ["Gastroenterologist"],

  arthritis: ["Orthopedic"],
  fracture: ["Orthopedic"],
  bone: ["Orthopedic"],
  joint: ["Orthopedic", "General Physician"],
  sprain: ["Orthopedic"],
  back: ["Orthopedic"],
  spine: ["Orthopedic"],
};

export function getSpecializationsForDisease(disease: string): string[] {
  const lower = disease.toLowerCase();
  const matched = new Set<string>();
  for (const [keyword, specs] of Object.entries(DISEASE_SPEC_MAP)) {
    if (lower.includes(keyword)) {
      specs.forEach((s) => matched.add(s));
    }
  }
  if (matched.size === 0) matched.add("General Physician");
  return Array.from(matched);
}
