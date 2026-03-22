import { buildTermFrequency } from "./buildTermFrequency"
import { cosineSimilarity } from "./cosineSimilarity"
import { tokenize } from "./tokenize"

export function textSimilarity(textA: string, textB: string): number {
  const tokensA = tokenize(textA)
  const tokensB = tokenize(textB)
  if (tokensA.length === 0 || tokensB.length === 0) return 0
  const tfA = buildTermFrequency(tokensA)
  const tfB = buildTermFrequency(tokensB)
  return cosineSimilarity(tfA, tfB)
}
