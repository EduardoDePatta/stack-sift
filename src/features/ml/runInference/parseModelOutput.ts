import type { MLClassificationResult } from "../types"
import { ML_CATEGORY_INDEX } from "./mlCategoryIndex"

export function parseModelOutput(
  probabilities: number[]
): MLClassificationResult {
  let maxIdx = 0
  let maxVal = -Infinity
  for (let i = 0; i < probabilities.length && i < ML_CATEGORY_INDEX.length; i++) {
    if (probabilities[i] > maxVal) {
      maxVal = probabilities[i]
      maxIdx = i
    }
  }

  const category = ML_CATEGORY_INDEX[maxIdx] ?? "unknown"
  const confidence = Math.max(0, Math.min(maxVal, 1))

  return {
    category,
    confidence: Math.round(confidence * 100) / 100,
    signals: [`model:${category}`]
  }
}
