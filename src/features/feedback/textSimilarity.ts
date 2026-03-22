const STOP_WORDS = new Set([
  "the", "a", "an", "in", "on", "at", "to", "for", "of", "is", "it",
  "and", "or", "not", "this", "that", "with", "from", "by", "as", "was",
  "be", "are", "has", "had", "have", "but", "if", "do", "no", "so",
  "de", "da", "do", "em", "um", "uma", "para", "com", "por", "que",
  "se", "na", "no", "os", "as", "ao", "dos", "das", "nos", "nas"
])

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_./\-:]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t))
}

export function buildTermFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>()
  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1)
  }
  return tf
}

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

export function textSimilarity(textA: string, textB: string): number {
  const tokensA = tokenize(textA)
  const tokensB = tokenize(textB)
  if (tokensA.length === 0 || tokensB.length === 0) return 0
  const tfA = buildTermFrequency(tokensA)
  const tfB = buildTermFrequency(tokensB)
  return cosineSimilarity(tfA, tfB)
}
