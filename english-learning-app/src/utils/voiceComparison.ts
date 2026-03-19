// utils/voiceComparison.ts
export function compareVoices(personFeatures: number[], aiFeatures: number[]): number {
  // Cosine similarity
  const dotProduct = personFeatures.reduce((sum, a, i) => sum + a * aiFeatures[i], 0);
  const normA = Math.sqrt(personFeatures.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(aiFeatures.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (normA * normB);
}