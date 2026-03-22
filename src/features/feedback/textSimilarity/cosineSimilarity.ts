export function cosineSimilarity(
  a: Map<string, number>,
  b: Map<string, number>
): number {
  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (const [term, freqA] of a) {
    normA += freqA * freqA
    const freqB = b.get(term) ?? 0
    dotProduct += freqA * freqB
  }

  for (const [, freqB] of b) {
    normB += freqB * freqB
  }

  if (normA === 0 || normB === 0) return 0

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}
